import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AUDIO_BLOCKED_EVENT,
    AUDIO_UNLOCK_EVENT,
    isAudioBlocked,
    playBeep,
} from '@/lib/notification-audio';

/**
 * Tanda yang terlihat saat browser memblokir suara notifikasi (kebijakan
 * autoplay). Tanpa ini, notifikasi masuk tanpa bunyi dan tanpa petunjuk.
 * Klik tombol ini memutar bunyi sekali dan membuka suara untuk halaman ini.
 */
export function AudioBlockedNotice() {
    const [blocked, setBlocked] = useState<boolean>(() => isAudioBlocked());

    useEffect(() => {
        const onBlocked = () => setBlocked(true);
        const onUnlocked = () => setBlocked(false);

        window.addEventListener(AUDIO_BLOCKED_EVENT, onBlocked);
        window.addEventListener(AUDIO_UNLOCK_EVENT, onUnlocked);

        return () => {
            window.removeEventListener(AUDIO_BLOCKED_EVENT, onBlocked);
            window.removeEventListener(AUDIO_UNLOCK_EVENT, onUnlocked);
        };
    }, []);

    // Layar display punya dialog "Aktifkan Suara" sendiri.
    if (!blocked || window.location.pathname.startsWith('/display')) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={() => {
                playBeep();
                setBlocked(false);
            }}
            className="fixed bottom-4 right-4 z-50 flex cursor-pointer items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-amber-600"
            aria-label="Aktifkan suara notifikasi"
        >
            <VolumeX className="size-4" aria-hidden="true" />
            <span>Klik untuk mengaktifkan suara notifikasi</span>
            <Volume2 className="size-4" aria-hidden="true" />
        </button>
    );
}
