import { Head } from '@inertiajs/react';
import { ExternalLink, FileText } from 'lucide-react';
import { OshBadge } from '@/components/shared/osh-badge';
import { PageContainer } from '@/components/shared/page-container';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, formatDateTime, formatTime } from '@/lib/utils';
import type { RouteDefinition } from '@/wayfinder';

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
    requested_by?: { id: number; name: string; email: string };
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
    backHref: string | RouteDefinition<'get'>;
    children?: React.ReactNode;
};

export default function BookingShow({ booking, backHref, children }: Props) {
    return (
        <>
            <Head title={`Booking: ${booking.title}`} />

            <PageContainer className="gap-6">
                <PageHeader title={booking.title} backHref={backHref} />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="grid gap-6 lg:col-span-2">
                        <div className="rounded-md border p-4">
                            <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                                Booking Details
                            </h2>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">
                                        Room
                                    </dt>
                                    <dd className="font-medium">
                                        {booking.room.name} (capacity:{' '}
                                        {booking.room.capacity})
                                    </dd>
                                </div>
                                {booking.requested_by && (
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Booked by
                                        </dt>
                                        <dd className="font-medium">
                                            {booking.requested_by.name}
                                        </dd>
                                        <dd className="text-muted-foreground text-xs">
                                            {booking.requested_by.email}
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-muted-foreground">
                                        Event Leader
                                    </dt>
                                    <dd className="font-medium">
                                        {booking.chairperson?.name ?? '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Participants
                                    </dt>
                                    <dd className="font-medium">
                                        {booking.participants_count}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Start Time
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDate(booking.start_time)}
                                        <br />
                                        {formatTime(booking.start_time)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        End Time
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDate(booking.end_time)}
                                        <br />
                                        {formatTime(booking.end_time)}
                                    </dd>
                                </div>
                                {booking.description && (
                                    <div className="col-span-2">
                                        <dt className="text-muted-foreground">
                                            Description
                                        </dt>
                                        <dd className="mt-1 whitespace-pre-wrap text-sm">
                                            {booking.description}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {booking.attachment_url && (
                            <div className="rounded-md border p-4">
                                <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                                    Attachment
                                </h2>
                                <div className="flex items-center gap-3">
                                    <FileText className="text-muted-foreground size-5" />
                                    <a
                                        href={booking.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                    >
                                        View PDF
                                        <ExternalLink className="size-3" />
                                    </a>
                                </div>
                                <div className="mt-4">
                                    <iframe
                                        src={booking.attachment_url}
                                        className="h-[500px] w-full rounded border"
                                        title="Attachment preview"
                                    />
                                </div>
                            </div>
                        )}

                        {booking.qr_attendance_url && (
                            <div className="rounded-md border p-4">
                                <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                                    QR Attendance
                                </h2>
                                <img
                                    src={booking.qr_attendance_url}
                                    alt="QR Attendance"
                                    className="h-40 w-40 rounded border object-contain"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid gap-6">
                        <div className="rounded-md border p-4">
                            <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                                OSH Level
                            </h2>
                            {booking.osh_level ? (
                                <div className="flex items-center gap-2">
                                    <OshBadge level={booking.osh_level} />
                                    <span className="text-muted-foreground text-xs">
                                        ({booking.osh_level.min_participants}–
                                        {booking.osh_level.max_participants}{' '}
                                        participants)
                                    </span>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    —
                                </p>
                            )}
                        </div>

                        <div className="rounded-md border p-4">
                            <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                                Status
                            </h2>
                            <div className="mb-3">
                                <StatusBadge label={booking.status} />
                            </div>
                            <dl className="grid gap-2 text-sm">
                                {booking.approved_by && (
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Approved by
                                        </dt>
                                        <dd className="font-medium">
                                            {booking.approved_by.name}
                                        </dd>
                                    </div>
                                )}
                                {booking.approved_at && (
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Approved at
                                        </dt>
                                        <dd className="font-medium">
                                            {formatDateTime(
                                                booking.approved_at,
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {booking.reason && (
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Rejection reason
                                        </dt>
                                        <dd className="text-sm text-red-600">
                                            {booking.reason}
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-muted-foreground">
                                        Created at
                                    </dt>
                                    <dd className="font-medium">
                                        {formatDateTime(booking.created_at)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {children}
                    </div>
                </div>
            </PageContainer>
        </>
    );
}
