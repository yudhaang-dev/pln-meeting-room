import { router, usePage } from '@inertiajs/react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { BookingForm } from '@/components/features/booking/booking-form';
import BookingShow from '@/components/features/booking/booking-show';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import bookings from '@/routes/bookings';

type Room = { id: number; name: string; capacity: number };
type Person = { id: number; name: string };

type Booking = {
    id: number;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    status: string;
    participants_count: number;
    reason: string | null;
    attachment_url: string | null;
    qr_attendance_url: string | null;
    created_at: string;
    room: { id: number; name: string; capacity: number };
    requested_by: { id: number; name: string; email: string };
    chairperson: { id: number; name: string } | null;
    osh_level: {
        id: number;
        name: string;
        color: string;
        min_participants: number;
        max_participants: number;
    } | null;
    approved_by: { id: number; name: string } | null;
    approved_at: string | null;
};

type Props = {
    booking: Booking;
    rooms: Room[];
    people: Person[];
};

export default function BookingsShow({ booking, rooms, people }: Props) {
    const { auth } = usePage().props;
    const isOperator = auth.user.role == 'operator';
    const isAdmin = auth.user.role == 'admin';
    const isAllowAction = isOperator || isAdmin;

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleApprove = () => {
        setProcessing(true);
        router.post(
            bookings.approve(booking.id).url,
            {},
            {
                onFinish: () => {
                    setProcessing(false);
                    setApproveOpen(false);
                },
                preserveState: true,
            },
        );
    };

    const handleReject = () => {
        if (!rejectReason.trim()) {
            return;
        }

        setProcessing(true);
        router.post(
            bookings.reject(booking.id).url,
            { reason: rejectReason },
            {
                onFinish: () => {
                    setProcessing(false);
                    setRejectOpen(false);
                    setRejectReason('');
                },
                preserveState: true,
            },
        );
    };

    const handleDelete = () => {
        setProcessing(true);
        router.delete(bookings.destroy(booking.id).url, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <BookingShow booking={booking} backHref={bookings.index()}>
                {isAllowAction && (
                    <div className="rounded-md border p-4">
                        <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                            Actions
                        </h2>
                        <div className="grid gap-2">
                            {booking.status === 'pending' && (
                                <>
                                    <Button
                                        size="sm"
                                        className="w-full justify-start gap-2"
                                        onClick={() => setApproveOpen(true)}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <Check className="size-4" />
                                        )}
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="w-full justify-start gap-2"
                                        onClick={() => {
                                            setRejectOpen(true);
                                            setRejectReason('');
                                        }}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <X className="size-4" />
                                        )}
                                        Reject
                                    </Button>
                                </>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => setEditOpen(true)}
                            >
                                <Pencil className="size-4" />
                                Edit
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive w-full justify-start gap-2"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="size-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                )}
            </BookingShow>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{booking.title}</strong>? This action cannot
                            be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve{' '}
                            <strong>{booking.title}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setApproveOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} disabled={processing}>
                            {processing && <Spinner />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={rejectOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectOpen(false);
                        setRejectReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Booking</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting{' '}
                            <strong>{booking.title}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="reject-reason">Reason *</Label>
                        <Textarea
                            id="reject-reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectOpen(false);
                                setRejectReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processing || !rejectReason.trim()}
                        >
                            {processing && <Spinner />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BookingForm
                open={editOpen}
                onOpenChange={setEditOpen}
                rooms={rooms}
                people={people}
                booking={{
                    id: booking.id,
                    title: booking.title,
                    description: booking.description,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    status: booking.status,
                    participants_count: booking.participants_count,
                    room_id: booking.room.id,
                    chairperson_id: booking.chairperson?.id ?? null,
                    attachment_url: booking.attachment_url,
                    qr_attendance_url: booking.qr_attendance_url,
                }}
            />
        </>
    );
}

BookingsShow.layout = {
    breadcrumbs: [
        {
            title: 'Bookings',
            href: bookings.index(),
        },
        {
            title: 'Detail',
            href: '',
        },
    ],
};
