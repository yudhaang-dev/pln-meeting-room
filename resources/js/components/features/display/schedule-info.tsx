import {
    format,
    formatDuration,
    intervalToDuration,
    isAfter,
    isBefore,
    isSameDay,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ClockIcon, MapPinIcon, User2Icon } from 'lucide-react';
import { useMemo } from 'react';
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { Badge } from '@/components/ui/badge';

type Schedule = {
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

type BadgeVariant = 'outline' | 'default' | 'secondary' | 'destructive';

type Props = {
    data: Schedule;
};

export function ScheduleInfo({ data }: Props) {
    const computedSchedule = useMemo(() => {
        const now = new Date();
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);

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
    }, [data.start_time, data.end_time]);

    return (
        <>
            <div>
                <div>
                    <Badge variant={computedSchedule.badgeVariant}>
                        {computedSchedule.statusText}
                    </Badge>
                </div>
                <div className="text-foreground flex flex-row items-center gap-2 text-sm font-medium">
                    <ClockIcon className="size-4" />
                    <span>
                        {computedSchedule.startTimeStr}
                        {' - '}
                        {computedSchedule.endTimeStr}
                    </span>
                </div>
                <div className="text-foreground mt-1 text-2xl font-bold">
                    {data.title}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Item className="p-0">
                    <ItemMedia variant="icon" className="">
                        <User2Icon className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle className="text-xs">Pimpinan</ItemTitle>
                        <ItemDescription className="text-foreground text-base font-bold">
                            {data.chairperson.name}
                        </ItemDescription>
                    </ItemContent>
                </Item>
                <Item className="p-0">
                    <ItemMedia variant="icon" className="">
                        <ClockIcon className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle className="text-xs">Durasi</ItemTitle>
                        <ItemDescription className="text-foreground text-base font-bold">
                            {computedSchedule.durationStr || '0 menit'}
                        </ItemDescription>
                    </ItemContent>
                </Item>
            </div>
        </>
    );
}
