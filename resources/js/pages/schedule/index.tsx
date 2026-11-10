import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MapPin, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { cn, formatDate, formatDayDate, formatTime } from '@/lib/utils';

type ScheduleBooking = {
    id: number;
    title: string;
    room: string | null;
    building: string | null;
    chairperson_id: number | null;
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

type Range = { start: string; prev: string; next: string; today: string };

// Warna badge pimpinan: tetap untuk pimpinan yang sama.
const CHAIR_COLORS = [
    '#c026d3',
    '#3b0764',
    '#f97316',
    '#ca8a04',
    '#0d9488',
    '#2563eb',
    '#dc2626',
    '#16a34a',
];

const chairColor = (id: number | null) =>
    id === null ? '#6b7280' : CHAIR_COLORS[id % CHAIR_COLORS.length];

export default function ScheduleIndex({
    days,
    range,
}: {
    days: Day[];
    range: Range;
}) {
    const [chair, setChair] = useState<number | null>(null);
    const go = (start: string) => `/schedule?start=${start}`;
    const isCurrent = range.start === range.today;

    const chairs = useMemo(() => {
        const map = new Map<number, string>();

        days.forEach((day) =>
            day.bookings.forEach((b) => {
                if (b.chairperson_id !== null && b.chairperson) {
                    map.set(b.chairperson_id, b.chairperson);
                }
            }),
        );

        return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    }, [days]);

    return (
        <>
            <Head title="Jadwal" />
            <PageContainer>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Minggu sebelumnya"
                                render={<Link href={go(range.prev)} />}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Minggu berikutnya"
                                render={<Link href={go(range.next)} />}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                        <Button
                            variant={isCurrent ? 'secondary' : 'outline'}
                            render={<Link href={go(range.today)} />}
                        >
                            Minggu Ini
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Jadwal</h1>
                            <p className="text-muted-foreground text-xs">
                                {formatDate(days[0].date)} -{' '}
                                {formatDate(days[days.length - 1].date)}
                            </p>
                        </div>
                    </div>

                    {chairs.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                                type="button"
                                onClick={() => setChair(null)}
                                className={cn(
                                    'rounded-full px-3 py-1 text-xs font-semibold',
                                    chair === null
                                        ? 'bg-foreground text-background'
                                        : 'bg-muted text-muted-foreground hover:bg-accent',
                                )}
                            >
                                SEMUA
                            </button>
                            {chairs.map(([id, name]) => (
                                <button
                                    type="button"
                                    key={id}
                                    onClick={() =>
                                        setChair(chair === id ? null : id)
                                    }
                                    className={cn(
                                        'rounded-full px-3 py-1 text-xs font-semibold uppercase',
                                        chair === id
                                            ? 'text-white'
                                            : 'bg-muted text-muted-foreground hover:bg-accent',
                                    )}
                                    style={
                                        chair === id
                                            ? { backgroundColor: chairColor(id) }
                                            : undefined
                                    }
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-7">
                    {days.map((day) => {
                        const [dayName] = formatDayDate(day.date).split(', ');
                        const items = day.bookings.filter(
                            (b) => chair === null || b.chairperson_id === chair,
                        );

                        return (
                            <section
                                key={day.date}
                                className={cn(
                                    'bg-muted/60 rounded-xl border p-2',
                                    day.is_today && 'border-teal-500',
                                )}
                            >
                                <header className="flex items-center gap-2 px-1 pb-2">
                                    <span
                                        className={cn(
                                            'flex size-9 shrink-0 items-center justify-center rounded-full text-base font-bold text-white',
                                            day.is_today
                                                ? 'bg-teal-600 ring-2 ring-teal-300'
                                                : 'bg-teal-500',
                                        )}
                                    >
                                        {day.date.slice(8, 10)}
                                    </span>
                                    <div className="leading-tight">
                                        <div className="text-sm font-bold">
                                            {dayName}
                                            {day.is_today && (
                                                <span className="ml-1 text-xs font-medium text-teal-700">
                                                    · Hari ini
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            {day.date.slice(8, 10)}/
                                            {day.date.slice(5, 7)}/
                                            {day.date.slice(0, 4)}
                                        </div>
                                    </div>
                                </header>

                                <div className="flex flex-col gap-2">
                                    {items.length === 0 && (
                                        <p className="text-muted-foreground px-1 pb-1 text-xs">
                                            Tidak ada rapat.
                                        </p>
                                    )}
                                    {items.map((b) => (
                                        <Link
                                            key={b.id}
                                            href={`/bookings/${b.id}`}
                                            className={cn(
                                                'bg-card hover:bg-accent block rounded-lg border p-3 text-sm shadow-xs',
                                                b.is_mine &&
                                                    'ring-primary ring-2',
                                                b.ended && 'opacity-60',
                                            )}
                                        >
                                            <div className="flex items-center gap-1 font-semibold text-red-500">
                                                {formatTime(b.start_time)} -{' '}
                                                {formatTime(
                                                    b.effective_end_time,
                                                )}
                                                {b.media === 'hybrid' && (
                                                    <Video
                                                        aria-label="Hybrid (Zoom)"
                                                        className="ml-auto size-4 text-blue-600"
                                                    />
                                                )}
                                            </div>
                                            <div className="text-foreground/80 mt-1 line-clamp-3">
                                                {b.title}
                                            </div>
                                            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                                <MapPin className="size-3 shrink-0" />
                                                {b.room ?? '-'}
                                                {b.building &&
                                                    `, ${b.building}`}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {b.chairperson && (
                                                    <span
                                                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase text-white"
                                                        style={{
                                                            backgroundColor:
                                                                chairColor(
                                                                    b.chairperson_id,
                                                                ),
                                                        }}
                                                    >
                                                        {b.chairperson}
                                                    </span>
                                                )}
                                                {b.is_mine && (
                                                    <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                                                        Milik Anda
                                                    </span>
                                                )}
                                                {b.ended && (
                                                    <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                                                        Selesai
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </PageContainer>
        </>
    );
}
