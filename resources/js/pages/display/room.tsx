import { Head, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { usePoll } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';

type Media = {
    id: number;
    type: string;
    name: string | null;
    file_url: string;
    mime: string | null;
};

type Room = {
    id: number;
    name: string;
    capacity: number;
    media: Media[];
};

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    participants_count: number;
    chairperson: { id: number; name: string } | null;
    osh_level: {
        id: number;
        name: string;
        color: string;
    } | null;
};

type Props = PageProps & {
    room: Room;
    currentBooking: Booking | null;
    nextBooking: Booking | null;
    orientation: string;
    refreshInterval: number;
};

export default function Room({ room, currentBooking, nextBooking, orientation, refreshInterval }: Props) {
    useEcho(`room.${room.id}`, 'booking.updated', () => {
        router.reload({ only: ['currentBooking', 'nextBooking'] });
    });

    useEcho(`room.${room.id}`, 'media.updated', () => {
        router.reload({ only: ['room'] });
    });

    usePoll(refreshInterval * 1000, {
        only: ['currentBooking', 'nextBooking'],
    });

    const isLandscape = orientation === 'landscape';

    return (
        <>
            <Head title={`${room.name} — Room Display`} />
            <div
                className={`flex h-screen w-screen overflow-hidden bg-black text-white ${isLandscape ? 'flex-row' : 'flex-col'}`}
            >
                {currentBooking ? (
                    <>
                        <div className={`flex flex-col justify-center px-12 ${isLandscape ? 'h-full w-1/2' : 'h-1/2 w-full'}`}>
                            <div className="mb-6">
                                <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
                                    IN PROGRESS
                                </span>
                            </div>
                            <h1 className="mb-4 text-5xl font-bold">{currentBooking.title}</h1>
                            <p className="mb-2 text-2xl text-white/60">{room.name}</p>

                            <div className="mt-6 flex items-center gap-6 text-lg text-white/50">
                                <span>
                                    {new Date(currentBooking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    {' — '}
                                    {new Date(currentBooking.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span>{currentBooking.participants_count} participants</span>
                            </div>

                            {currentBooking.chairperson && (
                                <p className="mt-4 text-lg text-white/40">Led by {currentBooking.chairperson.name}</p>
                            )}

                            {currentBooking.osh_level && (
                                <div className="mt-4 flex items-center gap-2">
                                    <span
                                        className="inline-block h-3 w-3 rounded-full"
                                        style={{ backgroundColor: currentBooking.osh_level.color }}
                                    />
                                    <span className="text-sm text-white/60">{currentBooking.osh_level.name}</span>
                                </div>
                            )}

                            {nextBooking && (
                                <div className="mt-10 border-t border-white/10 pt-6">
                                    <p className="text-sm text-white/40">NEXT EVENT</p>
                                    <p className="mt-1 text-xl font-semibold">{nextBooking.title}</p>
                                    <p className="text-white/50">
                                        {new Date(nextBooking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        {' — '}
                                        {new Date(nextBooking.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            )}
                        </div>

                        {room.media.length > 0 && (
                            <div className={`${isLandscape ? 'h-full w-1/2' : 'h-1/2 w-full'}`}>
                                {room.media[0].type === 'video' ? (
                                    <video
                                        src={room.media[0].file_url}
                                        className="h-full w-full object-cover"
                                        autoPlay
                                        loop
                                        muted
                                    />
                                ) : (
                                    <img
                                        src={room.media[0].file_url}
                                        alt={room.media[0].name ?? 'Media'}
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {room.media.length > 0 ? (
                            room.media.map((m) =>
                                m.type === 'video' ? (
                                    <video
                                        key={m.id}
                                        src={m.file_url}
                                        className="h-full w-full object-cover"
                                        autoPlay
                                        loop
                                        muted
                                    />
                                ) : (
                                    <img
                                        key={m.id}
                                        src={m.file_url}
                                        alt={m.name ?? 'Media'}
                                        className="h-full w-full object-cover"
                                    />
                                )
                            )
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <div className="text-center">
                                    <h1 className="mb-4 text-5xl font-bold">{room.name}</h1>
                                    <p className="text-2xl text-white/40">No upcoming events</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
