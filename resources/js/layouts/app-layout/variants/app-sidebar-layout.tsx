import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';
import type { BreadcrumbItem } from '@/types';
import { AppContent } from '../partials/app-content';
import { AppHeader } from '../partials/app-header';
import { AppSidebar } from '../partials/app-sidebar';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
    breadcrumbs?: BreadcrumbItem[];
};

export function AppSidebarLayout({ children, breadcrumbs = [] }: Props) {
    const isOpen = usePage().props.sidebarOpen;

    return (
        <SidebarProvider defaultOpen={isOpen}>
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </SidebarProvider>
    );
}
