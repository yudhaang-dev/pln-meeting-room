import { router } from '@inertiajs/react';
import { useConnectionStatus, useEchoPublic } from '@laravel/echo-react';
import { useEffect } from 'react';
import { MediaPlayer } from '@/components/features/display/media-player';
import { useDisplayPolling } from '@/hooks/use-display-polling';

type Media = {
    id: number;
    type: string;
    name: string;
    path: string;
    file_url: string;
    mime: string;
};

type Props = {
    media: Media[];
    orientation: string;
    refreshInterval: number;
    mediaLoopDuration: number;
};

export default function InfografisPage({
    media,
    refreshInterval,
    mediaLoopDuration,
}: Props) {
    // 1. Ambil status koneksi WebSocket Reverb ("connected", "disconnected", "connecting", dll)
    const connectionStatus = useConnectionStatus();

    // 2. Gunakan polling Inertia dengan opsi manual (autoStart: false)
    const { start: startPolling, stop: stopPolling } = useDisplayPolling(
        refreshInterval * 1000,
        {
            only: ['media', 'refreshInterval', 'mediaLoopDuration'],
        },
        {
            autoStart: false, // Mencegah polling berjalan saat pertama kali render
        },
    );

    useEchoPublic('Display.Global', '.MediaUpdated', () =>
        router.reload({ only: ['media'] }),
    );

    useEchoPublic('Display.Global', '.SettingsUpdated', () =>
        router.reload({
            only: ['refreshInterval', 'mediaLoopDuration'],
        }),
    );

    // 4. Logika Sakelar: Hidupkan Polling HANYA JIKA WebSocket Tidak Terhubung
    useEffect(() => {
        if (connectionStatus === 'connected') {
            stopPolling();
        } else {
            startPolling();
        }

        return () => stopPolling();
    }, [connectionStatus, startPolling, stopPolling]);

    return (
        <MediaPlayer
            items={media ?? []}
            className="h-svh w-full"
            duration={mediaLoopDuration}
        />
    );
}
