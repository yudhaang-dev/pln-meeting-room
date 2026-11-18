import { Head, router, usePage } from '@inertiajs/react';
import { TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFlashToast } from '@/hooks/use-flash-toast';
import bookings from '@/routes/bookings';
import type { BreadcrumbItem } from '@/types';
import { AppSidebarLayout } from './variants/app-sidebar-layout';

export default function AppLayout({
    breadcrumbs = [],
    children,
    title,
    pending_count,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
    title: string;
    pending_count: number;
}) {
    const { auth } = usePage().props;
    const unreadCount = auth.unreadNotifications?.length ?? 0;
    const hasWarning = pending_count > 0;
    const [open, setOpen] = useState<boolean>(hasWarning);

    const handleAction = () => {
        router.visit(
            bookings.index({
                query: {
                    status: 'pending',
                },
            }).url,
        );
        setOpen(false);
    };

    // 2. Hitung judul secara langsung (Derived State)
    const baseTitle = title || 'Dashboard';
    const dynamicTitle =
        unreadCount > 0
            ? `(${unreadCount}) Notifikasi Baru - ${baseTitle}`
            : baseTitle;

    useFlashToast();

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={dynamicTitle} />

            {children}
            {hasWarning && (
                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                            <AlertDialogMedia>
                                <TriangleAlertIcon />
                            </AlertDialogMedia>
                            <AlertDialogTitle>Butuh tindakan.</AlertDialogTitle>
                            <AlertDialogDescription>
                                Ada{' '}
                                <span className="font-bold">
                                    {pending_count}
                                </span>{' '}
                                booking yang belum ditindaklanjuti.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel variant="outline">
                                Abaikan
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleAction}>
                                Lihat Data
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </AppSidebarLayout>
    );
}
