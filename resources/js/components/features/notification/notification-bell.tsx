import { router, usePage } from '@inertiajs/react';
import { useEchoNotification } from '@laravel/echo-react';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import beepSound from '@/../assets/audio/beep.wav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import notifications from '@/routes/notifications';

let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) {
        return;
    }

    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    audioUnlocked = true;
    ctx.close();
}

function playBeep() {
    const audio = new Audio(beepSound);
    audio.volume = 1;
    audio.play().catch(() => {});
}

interface NotificationItem {
    id: string;
    data: Record<string, unknown>;
    created_at: string;
}

export function NotificationBell() {
    const { auth } = usePage().props as {
        auth: { user: { id: number } | null };
    };
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const hasFetched = useRef(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(notifications.recent.url());
            const data = await res.json();
            setUnreadCount(data.count);
            setItems(data.notifications);
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

    useEffect(() => {
        const handler = () => unlockAudio();
        document.addEventListener('click', handler, { once: true });

        return () => document.removeEventListener('click', handler);
    }, []);

    useEchoNotification(`App.Models.User.${auth.user?.id}`, () => {
        fetchNotifications();

        if (audioUnlocked) {
            playBeep();
        }
    });

    const postJson = async (url: string) => {
        const csrf =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '';

        return fetch(url, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrf,
                Accept: 'application/json',
            },
            credentials: 'same-origin',
        });
    };

    const handleMarkAllAsRead = async () => {
        try {
            await postJson(notifications.markAllAsRead.url());
            setUnreadCount(0);
            setItems([]);
        } catch {
            // silent
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await postJson(notifications.markAsRead.url({ notification: id }));
            setItems((prev) => prev.filter((n) => n.id !== id));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // silent
        }
    };

    if (!auth.user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" size="icon" className="relative" />
                }
            >
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
                                onClick={() =>
                                    handleMarkAsRead(notification.id)
                                }
                            >
                                <span className="text-sm font-medium">
                                    {String(
                                        notification.data.title ??
                                            notification.data.message ??
                                            'Notification',
                                    )}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {String(notification.data.body ?? '')}
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
