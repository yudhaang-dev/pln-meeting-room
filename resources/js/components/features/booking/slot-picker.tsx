import { addDays, format, parse } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Slot = { start: string; end: string; status: 'pending' | 'approved' };
type Rules = { now: string; advance_hours: number; max_days_ahead: number };
type RoomData = { room_id: number; slots: Slot[]; rules: Rules };
type Option = { value: string; label: string; disabled: boolean };

type Props = {
    roomId: string;
    excludeId?: number;
    /** datetime-local, mis. 2026-11-12T09:00 (kosong jika belum dipilih) */
    start: string;
    end: string;
    date: string;
    onDateChange: (date: string) => void;
    onChange: (value: { start: string; end: string }) => void;
    errors: { start_time?: string; end_time?: string };
};

const STEP = 30;
const DAY = 1440;
const DATE_FORMAT = 'yyyy-MM-dd';

/** "YYYY-MM-DD" + menit-dalam-hari -> menit absolut (tanpa zona waktu). */
const absOf = (date: string, minutes: number) => {
    const [y, m, d] = date.split('-').map(Number);

    return Date.UTC(y, m - 1, d) / 60000 + minutes;
};

/** "YYYY-MM-DD HH:mm" atau "YYYY-MM-DDTHH:mm" -> menit absolut. */
const absOfFull = (value: string) =>
    absOf(value.slice(0, 10), Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16)));

const fromAbs = (minutes: number) =>
    new Date(minutes * 60000).toISOString().slice(0, 16);

export function SlotPicker({
    roomId,
    excludeId,
    start,
    end,
    date,
    onDateChange,
    onChange,
    errors,
}: Props) {
    const [data, setData] = useState<RoomData | null>(null);
    const [failed, setFailed] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const prevRoom = useRef(roomId);
    const revalidate = useRef(false);

    useEffect(() => {
        if (prevRoom.current !== roomId) {
            prevRoom.current = roomId;
            revalidate.current = true;
        }
    }, [roomId]);

    useEffect(() => {
        setData(null);
        setFailed(false);

        if (!roomId) {
            return;
        }

        const controller = new AbortController();
        const params = new URLSearchParams({
            room_id: roomId,
            from: format(addDays(new Date(), -1), DATE_FORMAT),
            to: format(addDays(new Date(), 365), DATE_FORMAT),
        });

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
            .then((json: RoomData) => setData(json))
            .catch((error: unknown) => {
                if ((error as Error).name !== 'AbortError') {
                    setFailed(true);
                }
            });

        return () => controller.abort();
    }, [roomId, excludeId]);

    const model = useMemo(() => {
        if (!data) {
            return null;
        }

        const slots = data.slots.map((slot) => ({
            s: absOfFull(slot.start),
            e: absOfFull(slot.end),
        }));
        const now = absOfFull(data.rules.now);
        const minStart = now + data.rules.advance_hours * 60;
        const maxStart = now + data.rules.max_days_ahead * DAY;

        const startOptions = (day: string): Option[] => {
            const options: Option[] = [];

            for (let t = 0; t < DAY; t += STEP) {
                const a = absOf(day, t);

                options.push({
                    value: fromAbs(a),
                    label: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`,
                    disabled:
                        a < minStart ||
                        a > maxStart ||
                        slots.some((x) => x.s < a + STEP && x.e > a),
                });
            }

            return options;
        };

        const endOptions = (day: string, startValue: string): Option[] => {
            const options: Option[] = [];
            const startAbs = absOfFull(startValue);
            const dayEnd = absOf(day, DAY);

            for (
                let a = Math.floor(startAbs / STEP) * STEP + STEP;
                a <= dayEnd;
                a += STEP
            ) {
                if (a <= startAbs) {
                    continue;
                }

                const minutes = a - absOf(day, 0);

                options.push({
                    value: fromAbs(a),
                    label:
                        minutes === DAY
                            ? '24:00'
                            : `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
                    disabled: slots.some((x) => x.s < a && x.e > startAbs),
                });
            }

            return options;
        };

        const dayState = (day: string) => {
            const minDay = fromAbs(minStart).slice(0, 10);
            const maxDay = fromAbs(maxStart).slice(0, 10);

            if (day < minDay || day > maxDay) {
                return 'closed' as const;
            }

            if (startOptions(day).every((o) => o.disabled)) {
                return 'full' as const;
            }

            const dayStart = absOf(day, 0);
            const touched = slots.some((x) => x.s < dayStart + DAY && x.e > dayStart);

            return touched ? ('partial' as const) : ('free' as const);
        };

        return { startOptions, endOptions, dayState };
    }, [data]);

    // Setelah ruangan diganti: bersihkan jam yang tidak lagi tersedia di ruangan baru.
    useEffect(() => {
        if (!model || !data || String(data.room_id) !== roomId || !revalidate.current) {
            return;
        }

        revalidate.current = false;

        if (!date || !start) {
            return;
        }

        const startOk = model
            .startOptions(date)
            .some((o) => o.value === start && !o.disabled);

        if (!startOk) {
            onChange({ start: '', end: '' });

            return;
        }

        const endOk = model
            .endOptions(date, start)
            .some((o) => o.value === end && !o.disabled);

        if (!endOk) {
            onChange({ start, end: '' });
        }
    }, [model, data, roomId, date, start, end, onChange]);

    const withCurrent = (options: Option[], current: string, currentLabel: string) =>
        current && !options.some((o) => o.value === current)
            ? [...options, { value: current, label: currentLabel, disabled: false }]
            : options;

    const startItems = useMemo(() => {
        if (!model || !date) {
            return [];
        }

        return withCurrent(
            model.startOptions(date),
            start,
            start ? start.slice(11, 16) : '',
        );
    }, [model, date, start]);

    const endItems = useMemo(() => {
        if (!model || !date || !start) {
            return [];
        }

        return withCurrent(
            model.endOptions(date, start),
            end,
            end ? `${end.slice(11, 16)}${end.slice(0, 10) !== date ? ` (${end.slice(5, 10)})` : ''}` : '',
        );
    }, [model, date, start, end]);

    const handleDate = (day: Date | undefined) => {
        if (!day) {
            return;
        }

        const value = format(day, DATE_FORMAT);

        onDateChange(value);
        setCalendarOpen(false);

        // Pertahankan jam yang sama bila masih tersedia di tanggal baru.
        if (model && start) {
            const time = start.slice(11, 16);
            const keep = model
                .startOptions(value)
                .find((o) => o.label === time && !o.disabled);

            if (keep) {
                const endTime = end ? end.slice(11, 16) : '';
                const keepEnd = endTime
                    ? model
                          .endOptions(value, keep.value)
                          .find((o) => o.label === endTime && !o.disabled)
                    : undefined;

                onChange({ start: keep.value, end: keepEnd?.value ?? '' });

                return;
            }
        }

        onChange({ start: '', end: '' });
    };

    const handleStart = (value: string | null) => {
        if (!model || !value) {
            return;
        }

        const ends = model.endOptions(date, value).filter((o) => !o.disabled);
        const keep = ends.find((o) => o.value === end);
        const oneHour = fromAbs(absOfFull(value) + 60);
        const preferred = ends.find((o) => o.value === oneHour) ?? ends[0];

        onChange({ start: value, end: keep?.value ?? preferred?.value ?? '' });
    };

    const selectedDate = date ? parse(date, DATE_FORMAT, new Date()) : undefined;
    const ready = !!roomId && !!model;

    return (
        <div className="space-y-2">
            <div className="grid gap-4 md:grid-cols-3">
                <Field>
                    <FieldLabel>Tanggal</FieldLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger
                            disabled={!ready}
                            render={
                                <Button
                                    type="button"
                                    variant="outline"
                                    data-empty={!selectedDate}
                                    className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
                                />
                            }
                        >
                            <CalendarIcon />
                            {selectedDate ? (
                                format(selectedDate, 'd MMMM yyyy', {
                                    locale: idLocale,
                                })
                            ) : (
                                <span>Pilih tanggal</span>
                            )}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                locale={idLocale}
                                selected={selectedDate}
                                defaultMonth={selectedDate}
                                onSelect={handleDate}
                                disabled={(day) => {
                                    if (!model) {
                                        return true;
                                    }

                                    const state = model.dayState(
                                        format(day, DATE_FORMAT),
                                    );

                                    return state === 'closed' || state === 'full';
                                }}
                                modifiers={{
                                    partial: (day) =>
                                        model?.dayState(
                                            format(day, DATE_FORMAT),
                                        ) === 'partial',
                                }}
                                modifiersClassNames={{
                                    partial:
                                        '[&>button]:bg-amber-100 [&>button]:text-amber-900',
                                }}
                            />
                            <div className="text-muted-foreground flex items-center gap-3 border-t px-3 py-2 text-xs">
                                <span className="flex items-center gap-1">
                                    <span className="inline-block size-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-300" />
                                    Sebagian terisi
                                </span>
                                <span>Abu-abu: tidak tersedia</span>
                            </div>
                        </PopoverContent>
                    </Popover>
                </Field>

                <Field>
                    <FieldLabel>Jam Mulai</FieldLabel>
                    <Select
                        items={startItems}
                        value={start || null}
                        onValueChange={handleStart}
                        disabled={!ready || !date}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih jam mulai" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                                {startItems.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.disabled}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {errors.start_time && (
                        <FieldError>{errors.start_time}</FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel>Jam Selesai</FieldLabel>
                    <Select
                        items={endItems}
                        value={end || null}
                        onValueChange={(value) =>
                            value && onChange({ start, end: value })
                        }
                        disabled={!ready || !date || !start}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih jam selesai" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                                {endItems.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.disabled}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {errors.end_time && (
                        <FieldError>{errors.end_time}</FieldError>
                    )}
                </Field>
            </div>

            <p
                className={cn(
                    'text-xs',
                    failed ? 'text-amber-700' : 'text-muted-foreground',
                )}
            >
                {!roomId && 'Pilih ruangan terlebih dahulu untuk memilih tanggal dan jam.'}
                {roomId && !model && !failed && 'Memuat ketersediaan ruangan…'}
                {failed &&
                    'Ketersediaan tidak dapat dimuat. Muat ulang halaman, atau coba lagi nanti.'}
                {ready &&
                    'Tanggal dan jam yang sudah terisi (Pending atau Disetujui) dinonaktifkan.'}
            </p>
        </div>
    );
}
