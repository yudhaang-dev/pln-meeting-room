'use client';

import {
    format,
    isSameDay,
    isBefore,
    isAfter,
    intervalToDuration,
    formatDuration,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ClockIcon, MapPinIcon, User2Icon, UserIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    Item as AtomItem,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { cn } from '@/lib/utils';

type BadgeVariant = 'outline' | 'default' | 'secondary' | 'destructive';

type ItemType = {
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

type Props = {
    items?: ItemType[];
} & ComponentProps<'div'>;

function SimpleCardItem({
    item,
    computedSchedule,
    className,
}: {
    item: ItemType;
    computedSchedule: {
        statusText: string;
        badgeVariant: 'outline' | 'default' | 'secondary';
        startTimeStr: string;
        endTimeStr: string;
        durationStr: string;
    };
} & ComponentProps<'div'>) {
    return (
        <Card className={cn('relative w-full', className)}>
            <CardContent>
                <div className="flex flex-col gap-2">
                    <div className="flex w-full flex-row justify-between">
                        <div className="text-foreground flex flex-row items-center gap-2 text-sm font-medium">
                            <ClockIcon className="text-muted-foreground size-4" />
                            <span>
                                {computedSchedule.startTimeStr}
                                {' - '}
                                {computedSchedule.endTimeStr}
                            </span>
                        </div>
                        <Badge variant={computedSchedule.badgeVariant}>
                            {computedSchedule.statusText}
                        </Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {item.title}
                    </CardTitle>
                    <div className="text-foreground flex flex-row items-center gap-2 text-sm font-medium">
                        <UserIcon className="text-muted-foreground size-4" />
                        <span>{item.chairperson.name}</span>
                    </div>

                    <div className="text-foreground flex flex-row items-center gap-2 text-sm font-medium">
                        <MapPinIcon className="text-muted-foreground size-4" />
                        <div className="flex gap-4">
                            {item.room.name}, {item.room.building.name}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RichCardItem({
    item,
    computedSchedule,
    className,
}: {
    item: ItemType;
    computedSchedule: {
        statusText: string;
        badgeVariant: 'outline' | 'default' | 'secondary';
        startTimeStr: string;
        endTimeStr: string;
        durationStr: string;
    };
} & ComponentProps<'div'>) {
    return (
        <Card className={cn('w-full', className)}>
            <CardHeader>
                <CardAction>
                    <Badge variant={computedSchedule.badgeVariant}>
                        {computedSchedule.statusText}
                    </Badge>
                </CardAction>
                <CardTitle className="text-foreground flex flex-row items-center gap-2 text-sm font-medium">
                    <ClockIcon className="text-muted-foreground size-4" />
                    <span>
                        {computedSchedule.startTimeStr}
                        {' - '}
                        {computedSchedule.endTimeStr}
                    </span>
                </CardTitle>
                <CardDescription className="text-foreground mt-1 text-2xl font-bold">
                    {item.title}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <AtomItem className="p-0">
                        <ItemMedia
                            variant="icon"
                            className="text-muted-foreground"
                        >
                            <MapPinIcon className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-muted-foreground text-xs">
                                Ruangan
                            </ItemTitle>
                            <ItemDescription className="text-foreground text-base font-bold">
                                {item?.room?.name ?? '-'}
                            </ItemDescription>
                        </ItemContent>
                    </AtomItem>
                    <AtomItem className="p-0">
                        <ItemMedia
                            variant="icon"
                            className="text-muted-foreground"
                        >
                            <MapPinIcon className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-muted-foreground text-xs">
                                Gedung
                            </ItemTitle>
                            <ItemDescription className="text-foreground text-base font-bold">
                                {item?.room?.building?.name ?? '-'}
                            </ItemDescription>
                        </ItemContent>
                    </AtomItem>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <AtomItem className="p-0">
                        <ItemMedia
                            variant="icon"
                            className="text-muted-foreground"
                        >
                            <User2Icon className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-muted-foreground text-xs">
                                Pimpinan
                            </ItemTitle>
                            <ItemDescription className="text-foreground text-base font-bold">
                                {item?.chairperson?.name ?? '-'}
                            </ItemDescription>
                        </ItemContent>
                    </AtomItem>
                    <AtomItem className="p-0">
                        <ItemMedia
                            variant="icon"
                            className="text-muted-foreground"
                        >
                            <ClockIcon className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-muted-foreground text-xs">
                                Durasi
                            </ItemTitle>
                            <ItemDescription className="text-foreground text-base font-bold">
                                {computedSchedule.durationStr || '0 menit'}
                            </ItemDescription>
                        </ItemContent>
                    </AtomItem>
                </div>
            </CardContent>
        </Card>
    );
}

// Komponen Card Satuan (Menerima parameter 'now' yang up-to-date dari parent)
function ScheduleItem({
    item,
    now,
    className,
    isSimple = true,
}: { item: ItemType; now: Date; isSimple?: boolean } & ComponentProps<'div'>) {
    // Gunakan useMemo untuk membungkus seluruh perhitungan tanggal demi performa yang stabil
    const computedSchedule = useMemo(() => {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);

        // 1. Logika Penentuan Status Jadwal
        let statusText = 'Akan datang';
        let badgeVariant: BadgeVariant = 'outline';

        if (isAfter(now, end)) {
            statusText = 'Sudah selesai';
            badgeVariant = 'secondary';
        } else if (isAfter(now, start) && isBefore(now, end)) {
            statusText = 'Sedang berlangsung';
            badgeVariant = 'default';
        }

        // 2. Logika format waktu (Cross Day handling)
        const isSameDate = isSameDay(start, end);
        const startTimeStr = format(start, 'HH:mm');
        const endTimeStr = isSameDate
            ? format(end, 'HH:mm')
            : format(end, 'HH:mm (d MMM)', { locale: id });

        // 3. Hitung Durasi Pertemuan
        const durationStr = formatDuration(
            intervalToDuration({
                start: start,
                end: end,
            }),
            {
                format: ['hours', 'minutes'],
                locale: id,
            },
        );

        return {
            statusText,
            badgeVariant,
            startTimeStr,
            endTimeStr,
            durationStr,
        };
    }, [now, item.start_time, item.end_time]);

    return isSimple ? (
        <SimpleCardItem
            className={className}
            item={item}
            computedSchedule={computedSchedule}
        />
    ) : (
        <RichCardItem
            className={className}
            item={item}
            computedSchedule={computedSchedule}
        />
    );
}

// Komponen Utama List Jadwal (Parent yang memegang detak timer utama)
export function ScheduleItems({ items = [], className }: Props) {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    useEffect(() => {
        // Detak jam diperbarui setiap 5 detik sekali demi efisiensi resource kiosk
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div
            className={cn(
                'flex max-h-full w-full flex-1 flex-col items-center justify-center gap-4 overflow-y-auto',
                className,
            )}
        >
            {items.map((item, index) => (
                <ScheduleItem
                    className="w-full"
                    key={`booking-${item.id}-${index}`}
                    item={item}
                    now={currentTime}
                    isSimple={true}
                />
            ))}
        </div>
    );
}
