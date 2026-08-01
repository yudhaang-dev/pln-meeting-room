import { Link, usePage } from '@inertiajs/react';
import {
    ActivityIcon,
    Building2Icon,
    CalendarCheckIcon,
    LayersIcon,
    LayoutGridIcon,
    ListChecksIcon,
    SettingsIcon,
    ShieldCheckIcon,
    UserPlus2Icon,
    Users2Icon,
} from 'lucide-react';
import { AppLogo } from '@/components/shared/brand/app-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { home } from '@/routes';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

const platformMenu = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGridIcon,
    },
    {
        title: 'Bookings',
        href: '/bookings',
        icon: ListChecksIcon,
    },
];

const masterMenu = [
    {
        title: 'Buildings',
        href: '/buildings',
        icon: Building2Icon,
    },
    { title: 'Rooms', href: '/rooms', icon: CalendarCheckIcon },
    {
        title: 'Room Groups',
        href: '/room-groups',
        icon: LayersIcon,
    },
    {
        title: 'OSH Levels',
        href: '/osh-levels',
        icon: ShieldCheckIcon,
    },
    { title: 'People', href: '/people', icon: Users2Icon },
    { title: 'Users', href: '/users', icon: UserPlus2Icon },
    {
        title: 'Monitoring',
        href: '/admin/monitoring',
        icon: ActivityIcon,
    },
    {
        title: 'System Settings',
        href: '/settings/systems/general',
        icon: SettingsIcon,
    },
];

export function AppSidebar() {
    const { name, auth } = usePage().props;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="p-0">
                        <SidebarMenuButton
                            render={
                                <Link href={home()} prefetch>
                                    <AppLogo className="h-auto w-full rounded-lg transition-all duration-300 ease-in-out" />
                                    <div className="transition-all duration-300 ease-in-out">
                                        <p className="font-bold uppercase">
                                            Home
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {name}
                                        </p>
                                    </div>
                                </Link>
                            }
                            className="group-data-[collapsible=icon]:p-0! h-auto p-0 transition-all duration-300 ease-in-out"
                        />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={platformMenu} groupLabel="Patform" />
                {auth.user.role == 'admin' && (
                    <NavMain items={masterMenu} groupLabel="Master" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
