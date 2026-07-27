import { Link } from '@inertiajs/react';
import { CalendarPlus, CalendarRange, DoorOpen } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatDate, formatTime } from '@/lib/utils';
import bookings from '@/routes/bookings';

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    room: { id: number; name: string };
    chairperson: { name: string } | null;
};

type Props = {
    upcomingBookingsCount: number;
    nextBookings: Booking[];
    totalRooms: number;
};

export default function Dashboard({
    upcomingBookingsCount,
    nextBookings,
    totalRooms,
}: Props) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <Button asChild>
                    <Link href={bookings.create().url}>
                        <CalendarPlus className="mr-2 size-4" />
                        Book a Room
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>Upcoming Bookings</CardDescription>
                        <CalendarRange className="text-muted-foreground size-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {upcomingBookingsCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardDescription>Available Rooms</CardDescription>
                        <DoorOpen className="text-muted-foreground size-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRooms}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {nextBookings.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground mb-4 text-sm">
                                You have no upcoming bookings.
                            </p>
                            <Button asChild variant="outline">
                                <Link href={bookings.create().url}>
                                    Book a Room
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {nextBookings.map((booking) => (
                                <Link
                                    key={booking.id}
                                    href={bookings.show(booking.id).url}
                                    className="hover:bg-accent/50 flex items-center justify-between gap-2 rounded-md border p-3 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {booking.title}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {booking.room.name} &middot;{' '}
                                            {formatDate(booking.start_time)}{' '}
                                            {formatTime(booking.start_time)} -{' '}
                                            {formatTime(booking.end_time)}
                                        </p>
                                    </div>
                                    <StatusBadge label={booking.status} />
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
