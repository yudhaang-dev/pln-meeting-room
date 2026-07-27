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
import { ClockIcon, MapPinIcon, User2Icon } from 'lucide-react';
import type { ComponentProps } from 'react';
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
    Item,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { cn } from '@/lib/utils';

type Item = {
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
    items?: Item[];
} & ComponentProps<'div'>;

function ScheduleItem({ item }: { item: Item }) {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);
    const now = new Date(); // Waktu saat ini

    // 1. Logika Penentuan Status Jadwal
    let statusText = 'Akan datang';
    let badgeVariant: 'outline' | 'default' | 'secondary' | 'destructive' =
        'outline';

    if (isAfter(now, end)) {
        statusText = 'Sudah selesai';
        badgeVariant = 'secondary'; // Warna abu-abu / netral
    } else if (isAfter(now, start) && isBefore(now, end)) {
        statusText = 'Sedang berlangsung';
        badgeVariant = 'default'; // Warna utama (aktif)
    }

    // 2. Logika format waktu (Cross Day handling)
    const isSameDate = isSameDay(start, end);
    const startTimeStr = format(start, 'HH:mm');
    const endTimeStr = isSameDate
        ? format(end, 'HH:mm')
        : format(end, 'HH:mm (d MMM)', { locale: id });

    const duration = formatDuration(
        intervalToDuration({
            start: start,
            end: end,
        }),
        {
            format: ['hours', 'minutes'], // Exclude seconds entirely
            locale: id, // Translate the units
        },
    );

    return (
        <Card
            className={cn(
                'shadow-sm',
                statusText === 'Sudah selesai' ? 'opacity-70' : '',
            )}
        >
            <CardHeader>
                <CardAction>
                    <Badge variant={badgeVariant}>{statusText}</Badge>
                </CardAction>
                <CardTitle className="text-foreground flex flex-row items-center gap-2">
                    <span>
                        <ClockIcon className="size-4" />
                    </span>
                    <span>
                        {startTimeStr}
                        {' - '}
                        {endTimeStr}
                    </span>
                </CardTitle>
                <CardDescription className="text-foreground text-2xl font-bold">
                    {item.title}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <div className="grid grid-cols-2">
                    <Item className="p-0">
                        <ItemMedia
                            variant="icon"
                            className="text-muted-foreground"
                        >
                            <MapPinIcon />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-muted-foreground">
                                Ruangan
                            </ItemTitle>
                            <ItemDescription className="text-foreground text-lg font-bold">
                                {item.room.name}
                            </ItemDescription>
                        </ItemContent>
                    </Item>
                    <Item className="p-0">
                        <ItemMedia
                            variant="icon"
                            className="text-muted-foreground"
                        >
                            <MapPinIcon />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-muted-foreground">
                                Gedung
                            </ItemTitle>
                            <ItemDescription className="text-foreground text-lg font-bold">
                                {item.room?.building?.name ?? '-'}
                            </ItemDescription>
                        </ItemContent>
                    </Item>
                </div>
                <div className="grid grid-cols-2">
                    <Item className="p-0">
                        <ItemMedia
                            variant="icon"
                            className="text-muted-foreground"
                        >
                            <User2Icon />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-muted-foreground">
                                Pimpinan
                            </ItemTitle>
                            <ItemDescription className="text-foreground text-lg font-bold">
                                {item.chairperson.name}
                            </ItemDescription>
                        </ItemContent>
                    </Item>
                    <Item className="p-0">
                        <ItemMedia
                            variant="icon"
                            className="text-muted-foreground"
                        >
                            <ClockIcon />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-muted-foreground">
                                Durasi
                            </ItemTitle>
                            <ItemDescription className="text-foreground text-lg font-bold">
                                {duration}
                            </ItemDescription>
                        </ItemContent>
                    </Item>
                </div>
            </CardContent>
        </Card>
    );
}

export function ScheduleItems({ items = [], className }: Props) {
    return (
        <div className={cn('flex flex-col gap-4', className)}>
            {items.map((item, index) => (
                <ScheduleItem key={`booking-${item.id}-${index}`} item={item} />
            ))}
        </div>
    );
}
