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
                        <TableHead className="font-semibold">K3</TableHead>
                        <TableHead className="font-semibold">Jadwal</TableHead>
                        <TableHead className="font-semibold">Agenda</TableHead>
                        <TableHead className="font-semibold">
                            Pimpinan Acara
                        </TableHead>
                        <TableHead className="font-semibold">Ruangan</TableHead>
                        <TableHead className="font-semibold">Gedung</TableHead>
                        <TableHead className="font-semibold">Peserta</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <OshBadge level={item.osh_level} />
                            </TableCell>
                            <TableCell>
                                {formatTime(item.start_time)} —{' '}
                                {formatTime(item.end_time)}
                            </TableCell>
                            <TableCell> {item.title} </TableCell>
                            <TableCell>
                                {item.chairperson?.name ?? '—'}
                            </TableCell>
                            <TableCell>{item.room.name}</TableCell>
                            <TableCell>{item.room.building.name}</TableCell>
                            <TableCell>{item.participants_count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
