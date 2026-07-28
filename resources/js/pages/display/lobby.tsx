import type { PageProps } from '@inertiajs/core';
import { Head, router, usePoll } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { MediaPlayer } from '@/components/features/display/media-player';
import { MonitorFrame } from '@/components/features/display/monitor-frame';
import { ScheduleItems } from '@/components/features/display/schedule-items';
import AppLogo from '@/components/shared/brand/app-logo';
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
    media: Media[];
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
    orientation: string;
};

export default function Lobby({ roomGroup, bookings, orientation }: Props) {
    useEcho(`room-group.${roomGroup.id}`, 'booking.updated', () => {
        router.reload({ only: ['bookings'] });
    });

    useEcho(`room-group.${roomGroup.id}`, 'media.updated', () => {
        router.reload({ only: ['roomGroup'] });
    });

    usePoll(30_000, {
        only: ['bookings'],
    });

    const isLandscape = orientation == 'landscape';

    return (
        <>
            <Head title={`${roomGroup.name} — Lobby Display`} />
            {isLandscape ? (
                <div className={cn('flex h-svh w-full flex-row')}>
                    <div
                        className={cn(
                            'flex flex-col items-center justify-center gap-6 p-6',
                            isLandscape ? 'w-[70%]' : 'w-full',
                        )}
                    >
                        <AppLogo />
                        <MonitorFrame className="w-[90%]">
                            <MediaPlayer items={roomGroup.media} />
                        </MonitorFrame>
                    </div>
                    <div
                        className={cn(
                            'bg-pln-yellow/40 flex flex-col gap-6 p-6',
                            isLandscape ? 'w-[30%]' : 'w-full',
                        )}
                    >
                        <h1 className="text-center text-5xl font-bold uppercase text-cyan-700">
                            Agenda Hari Ini
                        </h1>
                        <ScheduleItems items={bookings} />
                    </div>
                </div>
            ) : (
                <div className={cn('flex h-svh w-full flex-col')}>
                    <div className="bg-pln-blue/40 h-[30%]">
                        <MediaPlayer items={roomGroup.media} />
                    </div>
                    <div
                        className={cn(
                            'border-pln-red flex h-[70%] flex-col gap-6 border-t-8 p-6',
                            'bg-pln-yellow/40',
                        )}
                    >
                        <h1 className="text-center text-5xl font-bold uppercase text-cyan-700">
                            Agenda Hari Ini
                        </h1>
                        <ScheduleItems items={bookings} />
                    </div>
                </div>
            )}
        </>
    );
}
