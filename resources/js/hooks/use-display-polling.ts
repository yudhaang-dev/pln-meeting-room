import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

// Muat ulang penuh tiap 6 jam agar layar (mis. Smart TV Tizen) pulih
// setelah standby lama atau koneksi WebSocket mati diam-diam.
const FULL_RELOAD_MS = 6 * 60 * 60 * 1000;
// Detak untuk mendeteksi timer yang dibekukan (TV standby). Dihitung dari jam
// dinding, bukan dari jumlah detak, sehingga tetap benar setelah standby lama.
const HEARTBEAT_MS = 30 * 1000;
// Selisih antar detak sebesar ini berarti halaman sempat tidur: muat ulang penuh.
const SLEEP_GAP_MS = 3 * 60 * 1000;
// Jaring pengaman: tetap muat data tiap 5 menit walau status WebSocket
// "connected", karena socket bisa mati diam-diam saat TV standby.
const SAFETY_POLL_MS = 5 * 60 * 1000;
// Jika polling gagal berturut-turut sebanyak ini, muat ulang halaman penuh.
const MAX_FAILURES = 5;

/**
 * Muat ulang halaman penuh, tetapi hanya bila server terjangkau. Memuat ulang
 * saat jaringan belum pulih membuat browser menampilkan halaman error (layar
 * putih) yang tidak bisa pulih sendiri; lebih baik tetap di halaman lama dan
 * coba lagi di detak berikutnya.
 */
let reloading = false;
// Tetap true sampai reload berhasil, agar detak berikutnya mencoba lagi.
let reloadPending = false;

async function safeReload(): Promise<void> {
    reloadPending = true;

    if (reloading) {
        return;
    }

    reloading = true;

    try {
        const response = await fetch(window.location.href, {
            method: 'HEAD',
            cache: 'no-store',
        });

        if (response.ok) {
            window.location.reload();

            return;
        }
    } catch {
        // Server belum terjangkau: coba lagi nanti.
    }

    reloading = false;
}

type UseDisplayPollingOptions = {
    only: string[];
};

type Options = {
    autoStart?: boolean;
};

export function useDisplayPolling(
    intervalMs: number,
    requestOptions: UseDisplayPollingOptions,
    options: Options = { autoStart: true },
) {
    const intervalRef = useRef(intervalMs);
    const onlyRef = useRef(requestOptions.only);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedRef = useRef(options.autoStart ?? true);
    const failuresRef = useRef(0);
    const hiddenAt = useRef(0);

    useEffect(() => {
        const loadedAt = Date.now();
        let lastBeat = Date.now();

        const beat = () => {
            const now = Date.now();
            const gap = now - lastBeat;
            lastBeat = now;

            // Timer sempat dibekukan (standby) atau sudah 6 jam sejak dimuat.
            if (
                reloadPending ||
                gap > SLEEP_GAP_MS ||
                now - loadedAt > FULL_RELOAD_MS
            ) {
                void safeReload();
            }
        };

        const heartbeat = setInterval(beat, HEARTBEAT_MS);

        // Halaman dipulihkan dari cache browser (bfcache) setelah TV bangun.
        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                void safeReload();
            }
        };

        window.addEventListener('pageshow', onPageShow);

        return () => {
            clearInterval(heartbeat);
            window.removeEventListener('pageshow', onPageShow);
        };
    }, []);

    useEffect(() => {
        hiddenAt.current = Date.now();

        const reloadData = () => {
            router.reload({ only: onlyRef.current });
        };

        // Error jaringan atau respons non-Inertia: hitung sebagai gagal.
        const offException = router.on('networkError', () => {
            failuresRef.current += 1;
        });
        const offInvalid = router.on('httpException', () => {
            failuresRef.current += 1;
        });

        const safetyTimer = setInterval(reloadData, SAFETY_POLL_MS);

        // Saat TV/tab bangun dari standby atau jaringan kembali.
        const onVisible = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            // Setelah standby lama, perbarui sebagian saja tidak cukup
            // (halaman bisa rusak/kedaluwarsa): muat ulang penuh.
            if (Date.now() - hiddenAt.current > SLEEP_GAP_MS) {
                void safeReload();

                return;
            }

            reloadData();
        };

        const onHidden = () => {
            if (document.visibilityState === 'hidden') {
                hiddenAt.current = Date.now();
            }
        };

        document.addEventListener('visibilitychange', onHidden);
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('online', reloadData);

        return () => {
            clearInterval(safetyTimer);
            offException();
            offInvalid();
            document.removeEventListener('visibilitychange', onHidden);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('online', reloadData);
        };
    }, []);

    const schedule = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            router.reload({
                only: onlyRef.current,
                onSuccess: () => {
                    failuresRef.current = 0;
                },
                onError: () => {
                    failuresRef.current += 1;
                },
                onFinish: () => {
                    if (failuresRef.current >= MAX_FAILURES) {
                        void safeReload();
                    }
                },
            });
        }, intervalRef.current);
    }, []);

    useEffect(() => {
        intervalRef.current = intervalMs;

        if (startedRef.current) {
            schedule();
        }
    }, [intervalMs, schedule]);

    useEffect(() => {
        onlyRef.current = requestOptions.only;
    }, [requestOptions.only]);

    const stop = useCallback(() => {
        startedRef.current = false;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        startedRef.current = true;
        schedule();
    }, [schedule]);

    useEffect(() => {
        if (startedRef.current) {
            start();
        }

        return stop;
    }, [start, stop]);

    return { start, stop };
}
