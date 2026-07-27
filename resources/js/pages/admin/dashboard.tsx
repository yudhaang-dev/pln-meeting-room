import { router, Link } from '@inertiajs/react';
import {
    Building,
    CheckCircle,
    Clock,
    DoorOpen,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatTime } from '@/lib/utils';
import bookings from '@/routes/bookings';

type Booking = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    room: { id: number; name: string };
    requested_by: { id: number; name: string };
    chairperson: { name: string } | null;
};

type Props = {
    totalBuildings: number;
    totalRooms: number;
    pendingBookingsCount: number;
    totalUsers: number;
    pendingBookings: Booking[];
    recentBookings: Booking[];
};

const stats = [
    { key: 'totalBuildings', label: 'Buildings', icon: Building },
    { key: 'totalRooms', label: 'Rooms', icon: DoorOpen },
    { key: 'pendingBookingsCount', label: 'Pending', icon: Clock },
    { key: 'totalUsers', label: 'Users', icon: Users },
] as const;

export default function AdminDashboard({
    totalBuildings,
    totalRooms,
    pendingBookingsCount,
    totalUsers,
    pendingBookings,
    recentBookings,
}: Props) {
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const counts: Record<string, number> = {
        totalBuildings,
        totalRooms,
        pendingBookingsCount,
        totalUsers,
    };

    const handleApprove = (id: number) => {
        setProcessing(true);
        router.patch(
            bookings.approve(id).url,
            {},
            {
                onFinish: () => setProcessing(false),
                preserveState: true,
            },
        );
    };

    const handleReject = () => {
        if (!rejectId || !rejectReason.trim()) {
            return;
        }

        setProcessing(true);
        router.patch(
            bookings.reject(rejectId).url,
            { reason: rejectReason },
            {
                onFinish: () => {
                    setProcessing(false);
                    setRejectId(null);
                    setRejectReason('');
                },
                preserveState: true,
            },
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map(({ key, label, icon: Icon }) => (
                    <Card key={key}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>{label}</CardDescription>
                            <Icon className="text-muted-foreground size-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {counts[key]}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Pending Approvals</span>
                            {pendingBookingsCount > 5 && (
                                <Link
                                    href={bookings.index({
                                        query: { status: 'pending' },
                                    }).url}
                                    className="text-muted-foreground text-sm font-normal hover:underline"
                                >
                                    View all ({pendingBookingsCount})
                                </Link>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingBookings.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                No pending bookings.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {pendingBookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="flex items-center justify-between gap-2 rounded-md border p-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {booking.title}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {booking.room.name} &middot;{' '}
                                                {formatDate(booking.start_time)}{' '}
                                                {formatTime(booking.start_time)}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <Button
                                                size="icon-xs"
                                                variant="outline"
                                                disabled={processing}
                                                onClick={() =>
                                                    handleApprove(booking.id)
                                                }
                                            >
                                                <CheckCircle className="size-3.5 text-green-600" />
                                            </Button>
                                            <Button
                                                size="icon-xs"
                                                variant="outline"
                                                disabled={processing}
                                                onClick={() =>
                                                    setRejectId(booking.id)
                                                }
                                            >
                                                <XCircle className="size-3.5 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentBookings.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                No recent bookings.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Room</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentBookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="max-w-[120px] truncate font-medium">
                                                {booking.title}
                                            </TableCell>
                                            <TableCell className="max-w-[80px] truncate text-muted-foreground">
                                                {booking.room.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                                {formatDate(
                                                    booking.start_time,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    label={booking.status}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={rejectId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectId(null);
                        setRejectReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Booking</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this booking.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Rejection reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectId(null);
                                setRejectReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={processing || !rejectReason.trim()}
                            onClick={handleReject}
                        >
                            {processing && <Spinner />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
