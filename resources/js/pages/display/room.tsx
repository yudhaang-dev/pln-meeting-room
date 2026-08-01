import type { PageProps } from '@inertiajs/core';
import { usePoll } from '@inertiajs/react';
import { Head, router } from '@inertiajs/react';
import { useConnectionStatus, useEchoPublic } from '@laravel/echo-react';
import { useEffect, useMemo } from 'react';
import { MediaPlayer } from '@/components/features/display/media-player';
import { TopBar } from '@/components/shared/general/top-bar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { formatTime } from '@/lib/utils';

type Media = {
    id: number;
    type: string;
    name: string | null;
    file_url: string;
    mime: string | null;
    path: string;
};

type Room = {
    id: number;
    name: string;
    capacity: number;
    building: {
        id: number;
        name: string;
    };
    media: Media[];
};

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    qr_attendance_url: string;
    description: string;
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
    room: Room;
    currentBooking: Booking | null;
    orientation: string;
    refreshInterval: number;
};

export default function Room({ room, currentBooking, refreshInterval }: Props) {
    // 1. Ambil status koneksi WebSocket Reverb ("connected", "disconnected", "connecting", dll)
    const connectionStatus = useConnectionStatus();

    // 2. Gunakan usePoll Inertia dengan opsi manual (autoStart: false)
    const { start: startPolling, stop: stopPolling } = usePoll(
        refreshInterval * 1000,
        {
            only: ['bookings', 'room'],
        },
        {
            autoStart: false, // Mencegah polling berjalan saat pertama kali render
        },
    );

    // 3. Listen Event menggunakan useEcho jika WebSocket aktif
    useEchoPublic(`Display.Room.${room.id}`, '.BookingUpdated', () =>
        router.reload({ only: ['currentBooking'] }),
    );

    useEchoPublic(`Display.Room.${room.id}`, '.MediaUpdated', () =>
        router.reload({ only: ['room'] }),
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

    const player = useMemo(() => {
        return (
            <MediaPlayer
                items={room.media ?? []}
                className="max-h-full bg-black"
            />
        );
    }, [room.media]);

    return (
        <>
            <Head title={`${room.name} — Room Display`} />
            {currentBooking ? (
                <div className="flex min-h-svh w-full flex-col">
                    <TopBar className="w-full gap-6 p-6" logoClass="max-h-12" />
                    <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col justify-between gap-6 p-6">
                        <div className="border-y-3 w-full space-y-6 border-transparent py-6 text-center">
                            <h1 className="text-6xl font-extrabold uppercase leading-tight">
                                {currentBooking.title}
                            </h1>
                            <div className="text-center">
                                <span>Pimpinan:</span>
                                <h2 className="text-5xl uppercase">
                                    {currentBooking.chairperson.name}
                                </h2>
                            </div>
                        </div>

                        <div className="mx-auto flex w-full max-w-5xl rounded-lg border bg-white p-4">
                            <div className="flex w-full flex-col justify-between p-10">
                                <div>
                                    <h4 className="text-2xl font-extrabold">
                                        {room.name}
                                    </h4>
                                    <p className="text-xl">
                                        {room.building.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-5xl font-extrabold leading-tight">
                                        {formatTime(currentBooking.start_time)}{' '}
                                        -{' '}
                                        {formatTime(
                                            currentBooking.end_time,
                                        )}{' '}
                                    </p>
                                </div>
                            </div>
                            <div className="w-auto">
                                <div className="bg-secondary rounded-lg border border-gray-500 p-3">
                                    <AspectRatio ratio={1} className="w-42">
                                        <img
                                            className="object-cover"
                                            src={
                                                currentBooking.qr_attendance_url ??
                                                '-'
                                            }
                                        />
                                    </AspectRatio>
                                </div>
                                <p className="text-center">
                                    Attendance QR Code
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <main className="relative flex h-svh w-full flex-col items-center justify-center">
                    <div className="h-full w-full">{player}</div>
                </main>
            )}
        </>
    );
}
