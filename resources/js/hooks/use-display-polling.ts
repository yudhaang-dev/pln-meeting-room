import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

// Muat ulang penuh tiap 6 jam agar layar (mis. Smart TV Tizen) pulih
// setelah standby lama atau koneksi WebSocket mati diam-diam.
const FULL_RELOAD_MS = 6 * 60 * 60 * 1000;
// Jaring pengaman: tetap muat data tiap 5 menit walau status WebSocket
// "connected", karena socket bisa mati diam-diam saat TV standby.
const SAFETY_POLL_MS = 5 * 60 * 1000;
// Jika polling gagal berturut-turut sebanyak ini, muat ulang halaman penuh.
const MAX_FAILURES = 5;

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

    useEffect(() => {
        const reloadTimer = setInterval(() => {
            window.location.reload();
        }, FULL_RELOAD_MS);

        return () => clearInterval(reloadTimer);
    }, []);

    useEffect(() => {
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
            if (document.visibilityState === 'visible') {
                reloadData();
            }
        };

        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('online', reloadData);

        return () => {
            clearInterval(safetyTimer);
            offException();
            offInvalid();
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
                        window.location.reload();
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
