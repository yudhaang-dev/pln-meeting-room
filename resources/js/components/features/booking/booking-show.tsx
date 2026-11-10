import { ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OshBadge } from '@/components/shared/osh-badge';
import { PageContainer } from '@/components/shared/page-container';
import { StatusBadge } from '@/components/shared/status-badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatTime } from '@/lib/utils';
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
    ended_at?: string | null;
};

type Props = {
    booking: Booking;
    backHref?: string | RouteDefinition<'get'>;
    children?: React.ReactNode;
};

export default function BookingShow({ booking, children }: Props) {
    const [imagePreview, setImagePreview] = useState<string>('');

    const safeUrl = imagePreview;

    const isPdf: boolean = useMemo(() => {
        return safeUrl.split('?')[0].toLowerCase().endsWith('.pdf');
    }, [safeUrl]);

    return (
        <>
            <PageContainer className="gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Detail Booking</h1>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="flex w-full flex-col gap-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Rincian Pengajuan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="divide-y divide-gray-100">
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                        <dt className="text-muted-foreground">
                                            Judul Acara
                                        </dt>
                                        <dd className="mt-1 font-medium sm:col-span-2 sm:mt-0">
                                            {booking.title}
                                        </dd>
                                    </div>
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                        <dt className="text-muted-foreground">
                                            Pimpinan Acara
                                        </dt>
                                        <dd className="mt-1 font-medium sm:col-span-2 sm:mt-0">
                                            {booking.chairperson?.name ?? '-'}
                                        </dd>
                                    </div>
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                        <dt className="text-muted-foreground">
                                            Ruangan | Gedung
                                        </dt>
                                        <dd className="mt-1 flex gap-6 font-medium sm:col-span-2 sm:mt-0">
                                            <div className="w-1/2">
                                                {booking.room?.name ?? '-'}
                                            </div>
                                            <Separator orientation="vertical" />
                                            <div className="w-1/2">
                                                {booking.room?.building?.name ??
                                                    ''}
                                            </div>
                                        </dd>
                                    </div>
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                        <dt className="text-muted-foreground">
                                            Waktu Pelaksanaan
                                        </dt>
                                        <dd className="mt-1 flex gap-6 font-medium sm:col-span-2 sm:mt-0">
                                            <div className="w-1/2">
                                                {formatDate(booking.start_time)}
                                                <br />
                                                {formatTime(booking.start_time)}
                                            </div>
                                            <Separator orientation="vertical" />
                                            <div className="w-1/2">
                                                {formatDate(booking.end_time)}
                                                <br />
                                                {formatTime(booking.end_time)}
                                            </div>
                                        </dd>
                                    </div>
                                    {booking.ended_at && (
                                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                            <dt className="text-muted-foreground">
                                                Selesai Aktual
                                            </dt>
                                            <dd className="mt-1 font-medium sm:col-span-2 sm:mt-0">
                                                {formatDate(booking.ended_at)}{' '}
                                                {formatTime(booking.ended_at)}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                        <dt className="text-muted-foreground">
                                            Jumlah Peserta | K3
                                        </dt>
                                        <dd className="mt-1 flex gap-6 font-medium sm:col-span-2 sm:mt-0">
                                            <div className="w-1/2">
                                                {booking.participants_count}{' '}
                                                Orang
                                            </div>
                                            <Separator orientation="vertical" />
                                            <div className="w-1/2">
                                                <OshBadge
                                                    level={booking.osh_level}
                                                />
                                            </div>
                                        </dd>
                                    </div>
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                        <dt className="text-muted-foreground">
                                            Keterangan
                                        </dt>
                                        <dd className="mt-1 whitespace-pre-line font-medium sm:col-span-2 sm:mt-0">
                                            {booking.description || '-'}
                                        </dd>
                                    </div>
                                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                        <dt className="text-muted-foreground">
                                            Lampiran
                                        </dt>
                                        <dd className="mt-1 flex gap-6 font-medium sm:col-span-2 sm:mt-0">
                                            <div className="w-1/2">
                                                <Button
                                                    variant="link"
                                                    onClick={() =>
                                                        setImagePreview(
                                                            String(
                                                                booking.attachment_url,
                                                            ),
                                                        )
                                                    }
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                >
                                                    Dokumen Sumber Acara
                                                    <ExternalLink className="size-3" />
                                                </Button>
                                            </div>
                                            <Separator orientation="vertical" />
                                            <div className="w-1/2">
                                                <Button
                                                    variant="link"
                                                    onClick={() =>
                                                        setImagePreview(
                                                            String(
                                                                booking.qr_attendance_url,
                                                            ),
                                                        )
                                                    }
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                >
                                                    QR Attendance
                                                    <ExternalLink className="size-3" />
                                                </Button>
                                            </div>
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex w-full flex-col gap-6">
                        {children}
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Pengajuan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="divide-y divide-gray-100">
                                    <div className="py-2 sm:grid">
                                        <dt className="text-muted-foreground">
                                            Status Pengajuan
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            <StatusBadge
                                                label={booking.status}
                                            />
                                        </dd>
                                    </div>
                                    {booking.reason && (
                                        <div className="py-2 sm:grid">
                                            <dt className="text-muted-foreground">
                                                Keterangan
                                            </dt>
                                            <dd className="mt-1 font-medium">
                                                {booking.reason}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="py-2 sm:grid">
                                        <dt className="text-muted-foreground">
                                            Diajukan oleh
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            {booking.requested_by.name}
                                            <br />
                                            <span className="text-muted-foreground text-xs">
                                                {booking.requested_by.email}
                                            </span>
                                        </dd>
                                    </div>
                                    <div className="py-2 sm:grid">
                                        <dt className="text-muted-foreground">
                                            Diajukan pada
                                        </dt>
                                        <dd className="mt-1 font-medium">
                                            {formatDate(booking.created_at)}{' '}
                                            {formatTime(booking.created_at)}
                                        </dd>
                                    </div>
                                    {booking.approved_by && (
                                        <div className="py-2 sm:grid">
                                            <dt className="text-muted-foreground">
                                                Ditindak-lanjuti oleh
                                            </dt>
                                            <dd className="mt-1 font-medium">
                                                {booking.approved_by.name}
                                                <br />
                                                <span className="text-muted-foreground text-xs">
                                                    {booking.approved_by.email}
                                                </span>
                                            </dd>
                                        </div>
                                    )}
                                    {booking.approved_at && (
                                        <div className="py-2 sm:grid">
                                            <dt className="text-muted-foreground">
                                                Ditindak-lanjuti pada
                                            </dt>
                                            <dd className="mt-1 font-medium">
                                                <>
                                                    {formatDate(
                                                        booking.approved_at,
                                                    )}{' '}
                                                    {formatTime(
                                                        booking.approved_at,
                                                    )}
                                                </>
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContainer>
            <Dialog
                open={imagePreview ? true : false}
                onOpenChange={() => setImagePreview('')}
            >
                <DialogContent className="max-h-full w-auto md:max-w-full">
                    {safeUrl && (
                        <AspectRatio
                            ratio={1}
                            className="min-w-sm w-full max-w-full md:max-w-sm"
                        >
                            {isPdf ? (
                                <iframe
                                    src={`${safeUrl}#toolbar=0`}
                                    title="Pratinjau File"
                                    className="size-full object-contain"
                                />
                            ) : (
                                <img
                                    src={safeUrl}
                                    className="size-full object-contain"
                                />
                            )}
                        </AspectRatio>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
