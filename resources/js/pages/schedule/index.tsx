import { Head, Link } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    User,
    Video,
} from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDate, formatDayDate, formatTime } from '@/lib/utils';

type ScheduleBooking = {
    id: number;
    title: string;
    room: string | null;
    building: string | null;
    chairperson: string | null;
    media?: 'offline' | 'hybrid';
    is_mine: boolean;
    osh_color?: string | null;
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

type Range = { start: string; prev: string; next: string; today: string };

export default function ScheduleIndex({
    days,
    range,
}: {
    days: Day[];
    range: Range;
}) {
    const go = (start: string) => `/schedule?start=${start}`;
    const isCurrent = range.start === range.today;

    return (
        <>
            <Head title="Jadwal" />
            <PageContainer>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Jadwal</h1>
                        <p className="text-muted-foreground text-sm">
                            {formatDate(days[0].date)} -{' '}
                            {formatDate(days[days.length - 1].date)} · rapat
                            yang disetujui
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Minggu sebelumnya"
                            render={<Link href={go(range.prev)} />}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant={isCurrent ? 'default' : 'outline'}
                            render={<Link href={go(range.today)} />}
                        >
                            Hari ini
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Minggu berikutnya"
                            render={<Link href={go(range.next)} />}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
                    {days.map((day) => (
                        <section
                            key={day.date}
                            className={cn(
                                'bg-card flex min-h-40 flex-col overflow-hidden rounded-lg border',
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
                                <div>
                                    {formatDayDate(day.date).split(', ')[0]}
                                    {day.is_today && ' · Hari ini'}
                                </div>
                                <div className="text-xs font-normal opacity-80">
                                    {formatDayDate(day.date).split(', ')[1]}
                                </div>
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
                                        style={
                                            b.osh_color
                                                ? {
                                                      borderLeftColor:
                                                          b.osh_color,
                                                      borderLeftWidth: 4,
                                                  }
                                                : undefined
                                        }
                                        className={cn(
                                            'hover:bg-accent block rounded-md border p-2 text-sm',
                                            b.is_mine && 'ring-primary ring-2',
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
