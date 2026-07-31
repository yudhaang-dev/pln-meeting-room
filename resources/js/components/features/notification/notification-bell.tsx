import { router, usePage } from '@inertiajs/react';
import { useEchoNotification } from '@laravel/echo-react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { playBeep } from '@/lib/notification-audio';
import bookings from '@/routes/bookings';
import notifications from '@/routes/notifications';

interface NotificationItem {
    id: string;
    data: {
        message: string;
        resource: string;
        payload: Record<string, unknown>;
    };
    created_at: string;
}

export function NotificationBell() {
    // Ambil data langsung dari Inertia global props alih-alih local state
    const { auth, _token } = usePage().props;
    const { user, unreadNotifications } = auth;

    const unreadCount = unreadNotifications?.length ?? 0;
    const items = unreadNotifications ?? [];

    // Jika ada notifikasi real-time masuk via Echo, suruh Inertia memperbarui props
    useEchoNotification(`App.Models.User.${user?.id}`, () => {
        router.reload({
            only: ['auth'], // Hanya perbarui data auth (hemat bandwidth)
            onSuccess: () => playBeep(),
        });
    });

    // Tandai semua dibaca: Controller backend harus me-return redirect() setelah update query
    const handleMarkAllAsRead = () => {
        router.post(
            notifications.markAllAsRead.url(),
            {},
            {
                preserveScroll: true,
                // Kita tidak perlu setUnreadCount(0) secara manual karena backend
                // akan me-redirect dan Inertia otomatis memperbarui data props di atas.
            },
        );
    };

    // Tandai satu dibaca dan arahkan halaman
    const handleMarkAsRead = (notification: NotificationItem) => {
        fetch(notifications.markAsRead(notification.id).url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': _token,
            },
        });
        router.visit(bookings.show(notification.data.payload.id as number));
    };

    if (!user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="size-5" />
                        {unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-xs"
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}
                    </Button>
                }
            />
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
                {items.length === 0 ? (
                    <div className="text-muted-foreground px-4 py-6 text-center text-sm">
                        No new notifications
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {items.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex cursor-pointer flex-col items-start gap-1 px-4 py-3"
                                onClick={() => handleMarkAsRead(notification)}
                            >
                                <span className="text-sm">
                                    {notification?.data.message ??
                                        'Notification'}
                                </span>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem
                            className="flex cursor-pointer justify-center border-t px-4 py-2"
                            onClick={() =>
                                router.visit(notifications.index.url())
                            }
                        >
                            <span className="text-muted-foreground text-xs">
                                View all {unreadCount} notification
                                {unreadCount !== 1 ? 's' : ''}
                            </span>
                        </DropdownMenuItem>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
