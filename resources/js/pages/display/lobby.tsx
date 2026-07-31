import type { PageProps } from '@inertiajs/core';
import { Head, router, usePoll } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useMemo } from 'react';
import { MediaPlayer } from '@/components/features/display/media-player';
import { ScheduleItems } from '@/components/features/display/schedule-items';
import { TopBar } from '@/components/shared/general/top-bar';
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
    refreshInterval: number;
    mediaLoopDuration: number;
};

export default function Lobby({ roomGroup, bookings, orientation, refreshInterval, mediaLoopDuration }: Props) {
    useEcho(`room-group.${roomGroup.id}`, 'booking.updated', () => {
        router.reload({ only: ['bookings'] });
    });

    useEcho(`room-group.${roomGroup.id}`, 'media.updated', () => {
        router.reload({ only: ['roomGroup'] });
    });

    usePoll(refreshInterval * 1000, {
        only: ['bookings'],
    });

    const isLandscape = orientation == 'landscape';

    const player = useMemo(() => {
        return (
            <MediaPlayer
                items={roomGroup.media ?? []}
                className="max-h-full bg-black"
            />
        );
    }, [roomGroup.media]);

    return (
        <>
            <Head title={`${roomGroup.name} — Lobby Display`} />
            {bookings.length > 0 ? (
                <main
                    className={cn(
                        'grid h-svh w-full',
                        isLandscape
                            ? 'grid-cols-6 grid-rows-1'
                            : 'grid-cols-1 grid-rows-6',
                    )}
                >
                    <div
                        className={cn(
                            'flex size-full flex-1 flex-col gap-4 overflow-hidden',
                            isLandscape ? 'col-span-4' : 'row-span-2',
                        )}
                    >
                        {player}
                    </div>
                    <div
                        className={cn(
                            'flex size-full min-h-0 flex-col overflow-hidden',
                            isLandscape ? 'col-span-2' : 'row-span-4',
                        )}
                    >
                        <TopBar className="h-auto p-6" logoClass="max-h-10" />
                        <div className="size-full min-h-0 flex-1 overflow-y-auto p-6">
                            <ScheduleItems items={bookings} />
                        </div>
                    </div>
                </main>
            ) : (
                <main className="h-svh w-full">{player}</main>
            )}
        </>
    );
}
