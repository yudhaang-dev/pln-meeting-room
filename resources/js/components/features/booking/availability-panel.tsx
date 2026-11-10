import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type Slot = { start: string; end: string; status: 'pending' | 'approved' };
type RoomAvailability = {
    id: number;
    name: string;
    capacity: number;
    building: string | null;
    slots: Slot[];
};

type Props = {
    /** Nilai datetime-local, mis. 2026-11-12T09:00 */
    start: string;
    end: string;
    /** Tanggal terpilih (boleh terisi walau jam belum dipilih). */
    date?: string;
    roomId: string;
    excludeId?: number;
    onSelectRoom: (roomId: string) => void;
    onConflictChange: (conflict: boolean) => void;
};

const DAY_MINUTES = 24 * 60;

const normalize = (value: string) => value.replace('T', ' ').slice(0, 16);

const minutesOfDay = (value: string, date: string) => {
    // value: "YYYY-MM-DD HH:mm"; di luar hari ini dijepit ke 0 atau 1440.
    const day = value.slice(0, 10);

    if (day < date) {
        return 0;
    }

    if (day > date) {
        return DAY_MINUTES;
    }

    return Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16));
};

const pct = (minutes: number) => `${(minutes / DAY_MINUTES) * 100}%`;

const label = (value: string, date: string) =>
    value.slice(0, 10) === date ? value.slice(11, 16) : value.slice(5, 16);

export function AvailabilityPanel({
    start,
    end,
    date: dateProp,
    roomId,
    excludeId,
    onSelectRoom,
    onConflictChange,
}: Props) {
    const date = dateProp || (start ? start.slice(0, 10) : '');
    const [rooms, setRooms] = useState<RoomAvailability[] | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!date) {
            return;
        }

        const controller = new AbortController();
        const params = new URLSearchParams({ date });

        if (excludeId) {
            params.set('exclude', String(excludeId));
        }

        fetch(`/bookings/availability?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(String(response.status));
                }

                return response.json();
            })
            .then((json: { rooms: RoomAvailability[] }) => {
                setRooms(json.rooms);
                setFailed(false);
            })
            .catch((error: unknown) => {
                if ((error as Error).name !== 'AbortError') {
                    setFailed(true);
                }
            });

        return () => controller.abort();
    }, [date, excludeId]);

    const selected = rooms?.find((room) => String(room.id) === roomId);
    const s = normalize(start);
    const e = normalize(end);

    const conflicts = useMemo(() => {
        if (!selected || !start || !end || e <= s) {
            return [];
        }

        return selected.slots.filter((slot) => slot.start < e && slot.end > s);
    }, [selected, start, end, s, e]);

    const hasConflict = conflicts.length > 0;

    useEffect(() => {
        onConflictChange(hasConflict);
    }, [hasConflict, onConflictChange]);

    if (!date) {
        return (
            <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                Pilih tanggal untuk melihat ketersediaan semua ruangan pada
                hari tersebut.
            </p>
        );
    }

    if (failed) {
        return (
            <p className="rounded-md border p-3 text-sm text-amber-700">
                Ketersediaan ruangan tidak dapat dimuat. Anda tetap bisa
                mengajukan; bentrok akan diperiksa saat pengajuan.
            </p>
        );
    }

    if (!rooms) {
        return (
            <p className="text-muted-foreground rounded-md border p-3 text-sm">
                Memuat ketersediaan…
            </p>
        );
    }

    const showSelection = start && end && e > s;

    return (
        <div className="space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">
                    Ketersediaan Ruangan · {date}
                </h3>
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                        <span className="inline-block size-2.5 rounded-sm bg-red-500" />
                        Disetujui
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block size-2.5 rounded-sm bg-amber-400" />
                        Menunggu
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block size-2.5 rounded-sm bg-green-200" />
                        Tersedia
                    </span>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="grid grid-cols-[8rem_1fr] items-end gap-2">
                    <span />
                    <div className="text-muted-foreground relative h-4 text-[10px]">
                        {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
                            <span
                                key={hour}
                                className="absolute"
                                style={{ left: pct(hour * 60) }}
                            >
                                {String(hour).padStart(2, '0')}
                            </span>
                        ))}
                    </div>
                </div>

                {rooms.map((room) => {
                    const isSelected = String(room.id) === roomId;

                    return (
                        <button
                            type="button"
                            key={room.id}
                            onClick={() => onSelectRoom(String(room.id))}
                            className={cn(
                                'grid w-full grid-cols-[8rem_1fr] items-center gap-2 rounded px-1 py-0.5 text-left',
                                isSelected
                                    ? 'bg-primary/10 ring-primary ring-1'
                                    : 'hover:bg-accent',
                            )}
                        >
                            <span className="truncate text-xs font-medium">
                                {room.name}
                            </span>
                            <span className="relative h-5 overflow-hidden rounded bg-green-100">
                                {room.slots.map((slot, i) => {
                                    const from = minutesOfDay(slot.start, date);
                                    const to = minutesOfDay(slot.end, date);

                                    return (
                                        <span
                                            key={i}
                                            className={cn(
                                                'absolute inset-y-0',
                                                slot.status === 'approved'
                                                    ? 'bg-red-500'
                                                    : 'bg-amber-400',
                                            )}
                                            style={{
                                                left: pct(from),
                                                width: pct(
                                                    Math.max(to - from, 0),
                                                ),
                                            }}
                                            title={`${label(slot.start, date)} - ${label(slot.end, date)}`}
                                        />
                                    );
                                })}
                                {isSelected && showSelection && (
                                    <span
                                        className="absolute inset-y-0 border-2 border-blue-600 bg-blue-500/20"
                                        style={{
                                            left: pct(minutesOfDay(s, date)),
                                            width: pct(
                                                Math.max(
                                                    minutesOfDay(e, date) -
                                                        minutesOfDay(s, date),
                                                    0,
                                                ),
                                            ),
                                        }}
                                    />
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {selected && selected.slots.length > 0 && (
                <p className="text-muted-foreground text-xs">
                    Terisi di {selected.name}:{' '}
                    {selected.slots
                        .map(
                            (slot) =>
                                `${label(slot.start, date)}–${label(slot.end, date)} (${slot.status === 'approved' ? 'disetujui' : 'menunggu'})`,
                        )
                        .join(', ')}
                </p>
            )}

            {hasConflict && (
                <p className="text-destructive text-sm font-medium">
                    Waktu yang dipilih bentrok dengan jadwal yang sudah ada di{' '}
                    {selected?.name}. Pilih waktu atau ruangan lain.
                </p>
            )}
            {!hasConflict && selected && showSelection && (
                <p className="text-sm font-medium text-green-700">
                    {selected.name} tersedia pada waktu yang dipilih.
                </p>
            )}
        </div>
    );
}
