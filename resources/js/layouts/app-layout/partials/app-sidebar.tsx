import { Link, usePage } from '@inertiajs/react';
import {
    Building2Icon,
    CalendarCheckIcon,
    CalendarRangeIcon,
    DoorOpenIcon,
    HistoryIcon,
    LayersIcon,
    LayoutGridIcon,
    ListChecksIcon,
    MonitorPlayIcon,
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
        title: 'Booking',
        href: '/bookings',
        icon: ListChecksIcon,
    },
    {
        title: 'Jadwal',
        href: '/schedule',
        icon: CalendarRangeIcon,
    },
    {
        title: 'Ruang Rapat',
        href: '/meeting-rooms',
        icon: DoorOpenIcon,
    },
];

const masterMenu = [
    {
        title: 'Gedung',
        href: '/buildings',
        icon: Building2Icon,
    },
    { title: 'Ruangan', href: '/rooms', icon: CalendarCheckIcon },
    {
        title: 'Kelompok Ruangan',
        href: '/room-groups',
        icon: LayersIcon,
    },
    {
        title: 'Level Keamanan',
        href: '/osh-levels',
        icon: ShieldCheckIcon,
    },
    { title: 'Pimpinan Acara', href: '/people', icon: Users2Icon },
    { title: 'Pengguna', href: '/users', icon: UserPlus2Icon },
    {
        title: 'Infografis',
        href: '/infografis',
        icon: MonitorPlayIcon,
    },
    {
        title: 'Log Aktivitas',
        href: '/admin/activity',
        icon: HistoryIcon,
    },
    {
        title: 'Pengaturan Sistem',
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
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            render={
                                <Link href={home()} prefetch>
                                    <AppLogo className="h-auto w-full transition-all duration-300 ease-in-out" />
                                    <div className="transition-all duration-300 ease-in-out">
                                        <p className="font-bold uppercase">
                                            Beranda
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
                <NavMain items={platformMenu} groupLabel="Platform" />
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
