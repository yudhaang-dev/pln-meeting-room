import { Head, router, usePage } from '@inertiajs/react';
import { Check, Flag, Pencil, Trash2, X } from 'lucide-react';
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
    room: {
        id: number;
        name: string;
        capacity: number;
        building: { name: string };
    };
    requested_by: { id: number; name: string; email: string };
    chairperson: { id: number; name: string } | null;
    osh_level: {
        id: number;
        name: string;
        color: string;
    };
    approved_by: { id: number; name: string; email: string } | null;
    approved_at: string | null;
    ended_at: string | null;
};

type Props = {
    booking: Booking;
    can_finish: boolean;
    rooms: Room[];
    people: Person[];
    osh_levels: {
        id: number;
        name: string;
        color: string;
    }[];
};

export default function BookingsShow({
    booking,
    can_finish,
    rooms,
    people,
    osh_levels,
}: Props) {
    const { auth } = usePage().props;
    const isOperator = auth.user.role == 'operator';
    const isAdmin = auth.user.role == 'admin';
    const isAllowAction = isOperator || isAdmin;
    const isOwnerRejected =
        auth.user.id === booking.requested_by.id &&
        booking.status === 'rejected';

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [finishOpen, setFinishOpen] = useState(false);
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

    const handleFinish = () => {
        setProcessing(true);
        router.post(
            bookings.finish(booking.id).url,
            {},
            {
                onFinish: () => {
                    setProcessing(false);
                    setFinishOpen(false);
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
            <Head title={`Booking: ${booking.title}`} />
            <BookingShow booking={booking} backHref={bookings.index()}>
                {can_finish && (
                    <div className="rounded-md border p-4">
                        <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                            Rapat Berlangsung
                        </h2>
                        <Button
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => setFinishOpen(true)}
                            disabled={processing}
                        >
                            <Flag className="size-4" />
                            Rapat selesai
                        </Button>
                    </div>
                )}
                {isAllowAction && (booking.status === 'pending' || isAdmin) && (
                    <div className="rounded-md border p-4">
                        <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                            Aksi
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
                                        Setujui
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
                                        Tolak
                                    </Button>
                                </>
                            )}
                            {isAdmin && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full justify-start gap-2"
                                        onClick={() => setEditOpen(true)}
                                    >
                                        <Pencil className="size-4" />
                                        Ubah
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-destructive hover:text-destructive w-full justify-start gap-2"
                                        onClick={() => setDeleteOpen(true)}
                                    >
                                        <Trash2 className="size-4" />
                                        Hapus
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
                {isOwnerRejected && !isAllowAction && (
                    <div className="rounded-md border p-4">
                        <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                            Aksi
                        </h2>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive w-full justify-start gap-2"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Trash2 className="size-4" />
                            Hapus
                        </Button>
                    </div>
                )}
            </BookingShow>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Booking</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus{' '}
                            <strong>{booking.title}</strong>? Tindakan ini tidak
                            dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rapat Selesai</DialogTitle>
                        <DialogDescription>
                            Tandai <strong>{booking.title}</strong> sebagai
                            selesai sekarang? Ruangan akan langsung tersedia
                            untuk booking lain.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setFinishOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleFinish} disabled={processing}>
                            {processing && <Spinner />}
                            Rapat selesai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setujui Booking</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menyetujui{' '}
                            <strong>{booking.title}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setApproveOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleApprove} disabled={processing}>
                            {processing && <Spinner />}
                            Setujui
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
                        <DialogTitle>Tolak Booking</DialogTitle>
                        <DialogDescription>
                            Berikan alasan penolakan untuk{' '}
                            <strong>{booking.title}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="reject-reason">Alasan *</Label>
                        <Textarea
                            id="reject-reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Tulis alasan penolakan..."
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
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processing || !rejectReason.trim()}
                        >
                            {processing && <Spinner />}
                            Tolak
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BookingForm
                open={editOpen}
                onOpenChange={setEditOpen}
                rooms={rooms}
                people={people}
                osh_levels={osh_levels}
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
                    osh_level_id: booking.osh_level?.id ?? null,
                    attachment_url: booking.attachment_url,
                    qr_attendance_url: booking.qr_attendance_url,
                }}
                onSuccess={() => router.reload()}
            />
        </>
    );
}

BookingsShow.layout = {
    breadcrumbs: [
        {
            title: 'Booking',
            href: bookings.index(),
        },
        {
            title: 'Detail',
            href: '',
        },
    ],
};
