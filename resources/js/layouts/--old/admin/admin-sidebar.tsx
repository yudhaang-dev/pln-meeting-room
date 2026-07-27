import { Link } from '@inertiajs/react';
import {
    Building2,
    CalendarCheck,
    Layers,
    LayoutGrid,
    ListChecks,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/layouts/--old/shared/app-logo';
import { NavUser } from '@/layouts/--old/shared/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

const managementNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
    { title: 'Buildings', href: '/admin/buildings', icon: Building2 },
    { title: 'Rooms', href: '/admin/rooms', icon: CalendarCheck },
    { title: 'Room Groups', href: '/admin/room-groups', icon: Layers },
    { title: 'OSH Levels', href: '/admin/osh-levels', icon: ShieldCheck },
    { title: 'People', href: '/admin/people', icon: Users },
    { title: 'Bookings', href: '/admin/bookings', icon: ListChecks },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'System Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={<Link href="/admin/dashboard" prefetch />}
                        >
                            <AppLogo />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarMenu>
                        {managementNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                    render={<Link href={item.href} prefetch />}
                                >
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
