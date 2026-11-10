import { Link } from '@inertiajs/react';
import { Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDayDate, formatTime } from '@/lib/utils';

export type UpcomingBooking = {
    id: number;
    title: string;
    chairperson: string | null;
    participants_count: number;
    media?: 'offline' | 'hybrid';
    is_mine?: boolean;
    start_time: string;
    end_time: string;
    effective_end_time: string;
};

export function UpcomingTable({ items }: { items: UpcomingBooking[] }) {
    if (items.length === 0) {
        return (
            <p className="text-muted-foreground px-6 py-4 text-sm">
                Tidak ada rapat mendatang.
            </p>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Pimpinan</TableHead>
                    <TableHead className="text-right">Peserta</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                            {formatDayDate(item.start_time)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                            {formatTime(item.start_time)} -{' '}
                            {formatTime(item.effective_end_time)}
                        </TableCell>
                        <TableCell>
                            <Link
                                href={`/bookings/${item.id}`}
                                className="font-medium hover:underline"
                            >
                                {item.title}
                            </Link>
                            {item.is_mine && (
                                <Badge className="ml-2">Milik Anda</Badge>
                            )}
                            {item.media === 'hybrid' && (
                                <Video
                                    aria-label="Hybrid (Zoom)"
                                    className="ml-2 inline-block size-4 text-blue-600"
                                />
                            )}
                        </TableCell>
                        <TableCell>{item.chairperson ?? '-'}</TableCell>
                        <TableCell className="text-right">
                            {item.participants_count} Orang
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
