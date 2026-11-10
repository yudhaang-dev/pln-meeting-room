import { Head, Link } from '@inertiajs/react';
import { Clock, MapPin, User, Video } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { Badge } from '@/components/ui/badge';
import { cn, formatDayDate, formatTime } from '@/lib/utils';

type ScheduleBooking = {
    id: number;
    title: string;
    room: string | null;
    building: string | null;
    chairperson: string | null;
    media?: 'offline' | 'hybrid';
    is_mine: boolean;
    start_time: string;
    end_time: string;
    effective_end_time: string;
    ended: boolean;
};

type Day = {
    date: string;
    is_today: boolean;
    bookings: ScheduleBooking[];
};

export default function ScheduleIndex({ days }: { days: Day[] }) {
    return (
        <>
            <Head title="Jadwal" />
            <PageContainer>
                <div>
                    <h1 className="text-2xl font-bold">Jadwal</h1>
                    <p className="text-muted-foreground text-sm">
                        Rapat yang disetujui, hari ini sampai 7 hari ke depan.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                    {days.map((day) => (
                        <section
                            key={day.date}
                            className={cn(
                                'bg-card flex min-h-40 flex-col rounded-lg border',
                                day.is_today && 'border-primary',
                            )}
                        >
                            <header
                                className={cn(
                                    'border-b px-3 py-2 text-sm font-semibold',
                                    day.is_today &&
                                        'bg-primary text-primary-foreground',
                                )}
                            >
                                {formatDayDate(day.date)}
                                {day.is_today && ' (Hari ini)'}
                            </header>
                            <div className="flex flex-1 flex-col gap-2 p-2">
                                {day.bookings.length === 0 && (
                                    <p className="text-muted-foreground p-2 text-xs">
                                        Tidak ada rapat.
                                    </p>
                                )}
                                {day.bookings.map((b) => (
                                    <Link
                                        key={b.id}
                                        href={`/bookings/${b.id}`}
                                        className={cn(
                                            'hover:bg-accent block rounded-md border p-2 text-sm',
                                            b.is_mine &&
                                                'border-primary border-l-4',
                                            b.ended && 'opacity-60',
                                        )}
                                    >
                                        <div className="flex items-center gap-1 text-xs font-medium">
                                            <Clock className="size-3" />
                                            {formatTime(b.start_time)} -{' '}
                                            {formatTime(b.effective_end_time)}
                                            {b.media === 'hybrid' && (
                                                <Video
                                                    aria-label="Hybrid (Zoom)"
                                                    className="ml-auto size-4 text-blue-600"
                                                />
                                            )}
                                        </div>
                                        <div className="mt-1 line-clamp-2 font-semibold">
                                            {b.title}
                                        </div>
                                        <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                            <MapPin className="size-3 shrink-0" />
                                            {b.room ?? '-'}
                                            {b.building && `, ${b.building}`}
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                            <User className="size-3 shrink-0" />
                                            {b.chairperson ?? '-'}
                                        </div>
                                        {(b.is_mine || b.ended) && (
                                            <div className="mt-1 flex gap-1">
                                                {b.is_mine && (
                                                    <Badge>Milik Anda</Badge>
                                                )}
                                                {b.ended && (
                                                    <Badge variant="secondary">
                                                        Selesai
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </PageContainer>
        </>
    );
}
