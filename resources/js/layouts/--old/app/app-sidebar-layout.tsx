import { usePage } from '@inertiajs/react';
import { AppContent } from '@/layouts/--old/shared/app-content';
import { AppShell } from '@/layouts/--old/shared/app-shell';
import { AppSidebar } from '@/layouts/--old/app/app-sidebar';
import { AdminSidebar } from '@/layouts/--old/admin/admin-sidebar';
import { AppSidebarHeader } from '@/layouts/--old/shared/app-sidebar-header';
import type { AppLayoutProps, User } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage().props;
    const user = auth?.user as User | undefined;
    const isAdminOrOperator =
        user?.role === 'admin' || user?.role === 'operator';

    return (
        <AppShell variant="sidebar">
            {isAdminOrOperator ? <AdminSidebar /> : <AppSidebar />}
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
