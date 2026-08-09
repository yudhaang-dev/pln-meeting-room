import type { PageProps } from '@inertiajs/core';
import { Head, router } from '@inertiajs/react';
import { useConnectionStatus, useEchoPublic } from '@laravel/echo-react';
import { useEffect, useMemo } from 'react';
import { MediaPlayer } from '@/components/features/display/media-player';
import { ScheduleItems } from '@/components/features/display/schedule-items';
import { useDisplayPolling } from '@/hooks/use-display-polling';
import { cn } from '@/lib/utils';

type Media = {
    id: number;
    type: string;
    name: string;
    path: string;
    file_url: string;
    mime: string;
};

type Room = {
    id: number;
    name: string;
    capacity: number;
};

type RoomGroup = {
    id: number;
    name: string;
    rooms: Room[];
};

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    room: {
        id: number;
        name: string;
        building: {
            id: number;
            name: string;
        };
    };
    chairperson: {
        id: number;
        name: string;
        photo_url: string;
    };
    osh_level: {
        id: number;
        name: string;
        color: string;
    };
};

type Props = PageProps & {
    roomGroup: RoomGroup;
    bookings: Booking[];
    media: Media[];
    orientation: string;
    refreshInterval: number;
    mediaLoopDuration: number;
};

export default function Lobby({
    roomGroup,
    bookings,
    media,
    orientation,
    refreshInterval,
    mediaLoopDuration,
}: Props) {
    // 1. Ambil status koneksi WebSocket Reverb ("connected", "disconnected", "connecting", dll)
    const connectionStatus = useConnectionStatus();

    // 2. Gunakan polling Inertia dengan opsi manual (autoStart: false)
    const { start: startPolling, stop: stopPolling } = useDisplayPolling(
        refreshInterval * 1000,
        {
            only: ['bookings', 'media', 'refreshInterval', 'mediaLoopDuration'],
        },
        {
            autoStart: false, // Mencegah polling berjalan saat pertama kali render
        },
    );

    useEchoPublic(`Display.RoomGroup.${roomGroup.id}`, '.BookingUpdated', () =>
        router.reload({ only: ['bookings'] }),
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

    const isLandscape = orientation == 'landscape';

    const player = useMemo(() => {
        return (
            <MediaPlayer
                items={media ?? []}
                className="max-h-full"
                duration={mediaLoopDuration}
            />
        );
    }, [media, mediaLoopDuration]);

    return (
        <>
            <Head title={`${roomGroup.name} — Lobby Display`} />
            {bookings.length > 0 ? (
                <main
                    className={cn(
                        'bg-linear-to-b grid h-svh w-full',
                        isLandscape
                            ? 'grid-rows-6 md:grid-cols-6 md:grid-rows-1'
                            : 'grid-cols-1 grid-rows-6',
                    )}
                >
                    <div
                        className={cn(
                            'flex size-full flex-1 flex-col overflow-hidden',
                            isLandscape
                                ? 'row-span-2 md:col-span-4'
                                : 'row-span-2',
                        )}
                    >
                        {player}
                    </div>
                    <div
                        className={cn(
                            'flex size-full min-h-0 flex-col overflow-hidden',
                            isLandscape
                                ? 'row-span-4 md:col-span-2'
                                : 'row-span-4',
                        )}
                    >
                        <div className="size-full min-h-0 flex-1 justify-items-center overflow-y-auto">
                            <ScheduleItems
                                className="bg-radial from-pln-blue/80 to-pln-yellow/20 h-full p-6"
                                items={bookings}
                            />
                        </div>
                    </div>
                </main>
            ) : (
                <main className="h-svh w-full">{player}</main>
            )}
        </>
    );
}
