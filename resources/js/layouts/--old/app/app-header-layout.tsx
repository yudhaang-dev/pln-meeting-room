import { AppContent } from '@/layouts/--old/shared/app-content';
import { AppHeader } from '@/layouts/--old/app/app-header';
import { AppShell } from '@/layouts/--old/shared/app-shell';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent variant="header">{children}</AppContent>
        </AppShell>
    );
}
