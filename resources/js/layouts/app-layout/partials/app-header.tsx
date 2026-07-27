import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { AppBreadcrumbs } from './app-breadcrumbs';

type Props = {
    breadcrumbs: BreadcrumbItemType[];
};

export function AppHeader({ breadcrumbs }: Props) {
    return (
        <header className="border-sidebar-border/50 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <AppBreadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto"></div>
        </header>
    );
}
