import { OshBadge } from '@/components/shared/osh-badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatTime } from '@/lib/utils';

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    participants_count: number;
    room: {
        name: string;
        building: {
            name: string;
        };
    };
    chairperson: { id: number; name: string } | null;
    osh_level: {
        name: string;
        color: string;
    };
};

type Props = {
    data?: Booking[];
    title?: string;
    date: string;
};

export function TableSchedule({ data = [], title = '', date = '' }: Props) {
    return (
        <Card className="w-full gap-0 p-0">
            <CardHeader className="pb-2! flex flex-row items-center justify-between border-b px-4 py-2">
                <CardTitle className="text-xl font-bold uppercase">
                    {title}
                </CardTitle>
                <div className="text-muted-foreground font-semibold">
                    {date}
                </div>
            </CardHeader>
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-semibold">Jadwal</TableHead>
                        <TableHead className="font-semibold">Agenda</TableHead>
                        <TableHead className="font-semibold">Lokasi</TableHead>
                        <TableHead className="font-semibold">
                            Level Keamanan
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                {formatTime(item.start_time)} —{' '}
                                {formatTime(item.end_time)}
                            </TableCell>
                            <TableCell>
                                <span className="font-bold">{item.title}</span>
                                <br />
                                <span>{item.chairperson?.name ?? '—'}</span>
                            </TableCell>
                            <TableCell>
                                <span className="font-bold">
                                    {item.room.name}
                                </span>
                                <br />
                                <span>{item.room.building.name}</span>
                            </TableCell>
                            <TableCell>
                                <OshBadge level={item.osh_level} />
                                <span className="text-muted-foreground px-2">
                                    |
                                </span>
                                <span>{item.participants_count} Orang</span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
