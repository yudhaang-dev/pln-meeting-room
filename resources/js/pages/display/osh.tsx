import type { PageProps } from '@inertiajs/core';
import { Head, router, usePoll } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useRef } from 'react';
import { TableSchedule } from '@/components/features/display/table-schedule';
import { TopBar } from '@/components/shared/general/top-bar';
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
    const prevCountRef = useRef(todayBookings.length);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playBeep = () => {
        try {
            // Menggunakan satu AudioContext tunggal via Ref agar tidak memory leak
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (
                    window.AudioContext || (window as any).webkitAudioContext
                )();
            }

            const ctx = audioCtxRef.current;

            // Resume jika di-suspend oleh browser policy
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = 800;
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + 0.5,
            );

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error('Audio play failed:', e);
        }
    };

    useEffect(() => {
        if (todayBookings.length > prevCountRef.current) {
            playBeep();
        }

        prevCountRef.current = todayBookings.length;
    }, [todayBookings.length]);

    useEcho('bookings', 'booking.updated', () => {
        router.reload({ only: ['todayBookings', 'tomorrowBookings'] });
    });

    usePoll(refreshInterval * 1000, {
        only: ['todayBookings', 'tomorrowBookings'],
    });

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
                        date={formatDayDate(new Date())}
                    />
                    <TableSchedule
                        data={tomorrowBookings}
                        title="Jadwal Besok"
                        date={formatDayDate(new Date())}
                    />
                </div>
            </div>
        </>
    );
}
