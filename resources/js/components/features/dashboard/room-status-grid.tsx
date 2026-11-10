import { Link } from '@inertiajs/react';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import bookings from '@/routes/bookings';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export type RoomStatus = {
    id: number;
    name: string;
    building: string | null;
    booking: {
        id: number;
        title: string;
        is_mine?: boolean;
        chairperson: string | null;
        start_time: string;
        end_time: string;
        effective_end_time: string;
    } | null;
};

export function RoomStatusGrid({ rooms }: { rooms: RoomStatus[] }) {
    const used = rooms.filter((r) => r.booking).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    Status Ruangan Saat Ini
                </CardTitle>
                <CardDescription>
                    {used} terpakai, {rooms.length - used} tersedia
                </CardDescription>
            </CardHeader>
            <CardContent>
                {rooms.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Belum ada ruangan aktif.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {rooms.map((room) => {
                            const body = (
                                <>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold">
                                            {room.name}
                                        </span>
                                        <span className="text-xs font-medium">
                                            {room.booking
                                                ? 'Terpakai'
                                                : 'Tersedia'}
                                        </span>
                                    </div>
                                    <div className="text-xs opacity-80">
                                        {room.building ?? '-'}
                                    </div>
                                    {room.booking && (
                                        <div className="mt-2 text-sm">
                                            <div className="line-clamp-2 font-medium">
                                                {room.booking.title}
                                            </div>
                                            {room.booking.is_mine && (
                                                <div className="text-xs font-semibold">
                                                    ★ Milik Anda
                                                </div>
                                            )}
                                            <div className="text-xs opacity-80">
                                                {formatTime(
                                                    room.booking.start_time,
                                                )}{' '}
                                                -{' '}
                                                {formatTime(
                                                    room.booking
                                                        .effective_end_time,
                                                )}
                                                {room.booking.chairperson &&
                                                    ` · ${room.booking.chairperson}`}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                            const cls = cn(
                                'block rounded-lg border p-3',
                                room.booking
                                    ? 'border-red-300 bg-red-100 text-red-900 hover:bg-red-200 dark:border-red-900 dark:bg-red-950 dark:text-red-100'
                                    : 'border-green-300 bg-green-100 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100',
                            );

                            return room.booking ? (
                                <Link
                                    key={room.id}
                                    href={bookings.show(room.booking.id).url}
                                    className={cls}
                                >
                                    {body}
                                </Link>
                            ) : (
                                <div key={room.id} className={cls}>
                                    {body}
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
