import type { PageProps } from '@inertiajs/core';
import { Head, router, usePoll } from '@inertiajs/react';
import { useConnectionStatus, useEchoPublic } from '@laravel/echo-react';
import { useEffect } from 'react';
import { TableSchedule } from '@/components/features/display/table-schedule';
import { TopBar } from '@/components/shared/general/top-bar';
import { playBeep } from '@/lib/notification-audio';
import { cn, formatDayDate } from '@/lib/utils';

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    participants_count: number;
    room: {
        id: number;
        name: string;
        building: {
            name: string;
        };
    };
    chairperson: { id: number; name: string } | null;
    osh_level: {
        id: number;
        name: string;
        color: string;
        min_participants: number;
        max_participants: number;
    };
};

type Props = PageProps & {
    todayBookings: Booking[];
    tomorrowBookings: Booking[];
    orientation: string;
    refreshInterval: number;
};

export default function Osh({
    todayBookings,
    tomorrowBookings,
    orientation,
    refreshInterval,
}: Props) {
    // 1. Ambil status koneksi WebSocket Reverb ("connected", "disconnected", "connecting", dll)
    const connectionStatus = useConnectionStatus();

    // 2. Gunakan usePoll Inertia dengan opsi manual (autoStart: false)
    const { start: startPolling, stop: stopPolling } = usePoll(
        refreshInterval * 1000,
        {
            only: ['todayBookings', 'tomorrowBookings'],
        },
        {
            autoStart: false, // Mencegah polling berjalan saat pertama kali render
        },
    );

    // 3. Listen Event menggunakan useEcho jika WebSocket aktif
    useEchoPublic(`Display.Osh`, 'BookingUpdated', (e) => {
        console.log(e);
        playBeep();
        router.reload({ only: ['todayBookings', 'tomorrowBookings'] });
    });

    // 4. Logika Sakelar: Hidupkan Polling HANYA JIKA WebSocket Tidak Terhubung
    useEffect(() => {
        if (connectionStatus === 'connected') {
            stopPolling();
        } else {
            startPolling();
        }

        return () => stopPolling();
    }, [connectionStatus, startPolling, stopPolling]);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
        <>
            <Head title="OSH Display" />
            <div className="flex min-h-svh w-full flex-col">
                <TopBar className="w-full gap-6 p-6" logoClass="max-h-12" />
                <div
                    className={cn(
                        'grid w-full gap-8 p-6',
                        orientation == 'portrait' ? '' : 'grid-cols-2',
                    )}
                >
                    <TableSchedule
                        data={todayBookings}
                        title="Jadwal Hari Ini"
                        date={formatDayDate(today)}
                    />
                    <TableSchedule
                        data={tomorrowBookings}
                        title="Jadwal Besok"
                        date={formatDayDate(tomorrow)}
                    />
                </div>
            </div>
        </>
    );
}
