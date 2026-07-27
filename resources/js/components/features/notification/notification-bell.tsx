import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import notifications from '@/routes/notifications';

const audio = new Audio('/audio/beep.wav');

export function NotificationBell() {
    const { auth } = usePage().props as {
        auth: { user: { id: number } | null };
    };
    const [unreadCount, setUnreadCount] = useState(0);
    const hasFetched = useRef(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(notifications.unreadCount.url());
            const data = await res.json();
            setUnreadCount(data.count);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        if (!auth.user || hasFetched.current) {
            return;
        }

        hasFetched.current = true;
        fetchNotifications();
    }, [auth.user, fetchNotifications]);

    useEcho(
        'bookings',
        'booking.updated',
        () => {
            fetchNotifications();
            audio.play().catch(() => {});
        },
        [],
        'public',
    );

    const handleMarkAllAsRead = () => {
        router.post(
            notifications.markAllAsRead.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setUnreadCount(0);
                },
            },
        );
    };

    if (!auth.user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
                <Bell className="size-5" />
                {unreadCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-xs"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between border-b px-4 py-2">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto text-xs"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all read
                </Button>
                    )}
                </div>
                {unreadCount === 0 ? (
                    <div className="text-muted-foreground px-4 py-6 text-center text-sm">
                        No new notifications
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        <DropdownMenuItem
                            className="flex cursor-pointer flex-col items-start gap-1"
                            onClick={() =>
                                router.visit(notifications.index.url())
                            }
                        >
                            <span className="text-muted-foreground text-xs">
                                View all {unreadCount} unread notification
                                {unreadCount !== 1 ? 's' : ''}
                            </span>
                        </DropdownMenuItem>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
