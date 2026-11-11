import { router, usePage } from '@inertiajs/react';
import { useEchoNotification } from '@laravel/echo-react';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { playBeep } from '@/lib/notification-audio';
import { flashTitle } from '@/lib/title-flash';
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

const ANNOUNCED_KEY = 'announced-notification-ids';

function readAnnounced(): string[] {
    try {
        return JSON.parse(
            window.sessionStorage.getItem(ANNOUNCED_KEY) ?? '[]',
        ) as string[];
    } catch {
        return [];
    }
}

function writeAnnounced(ids: string[]) {
    try {
        window.sessionStorage.setItem(
            ANNOUNCED_KEY,
            JSON.stringify(ids.slice(-100)),
        );
    } catch {
        // sessionStorage tidak tersedia; abaikan
    }
}

function showPopup(message: string, status?: unknown) {
    const options = { duration: 10000 };

    if (status === 'rejected') {
        toast.error(message, options);
    } else if (status === 'approved') {
        toast.success(message, options);
    } else {
        toast.info(message, options);
    }
}

export function NotificationBell() {
    // Ambil data langsung dari Inertia global props alih-alih local state
    const { auth, _token } = usePage().props;
    const { user, unreadNotifications } = auth;

    const unreadCount = unreadNotifications?.length ?? 0;
    const items = unreadNotifications ?? [];

    // Jika ada notifikasi real-time masuk via Echo, suruh Inertia memperbarui props
    useEchoNotification(
        `App.Models.User.${user?.id}`,
        (notification: unknown) => {
            const n = notification as {
                id?: string;
                message?: string;
                payload?: { status?: string };
            };

            flashTitle('Notifikasi Baru');
            showPopup(n.message ?? 'Notifikasi baru', n.payload?.status);
            playBeep();

            if (n.id) {
                writeAnnounced([...readAnnounced(), n.id]);
            }

            router.reload({
                only: ['auth'], // Hanya perbarui data auth (hemat bandwidth)
            });
        },
    );

    // Pengguna bisa jauh dari perangkat (PC standby, jaringan putus, tab di
    // belakang), sehingga event realtime terlewat. Saat tab terlihat lagi atau
    // jaringan kembali, ambil ulang data notifikasi; efek di bawah lalu
    // mengumumkan yang belum diumumkan.
    useEffect(() => {
        let last = 0;

        const refresh = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            const now = Date.now();

            if (now - last < 5000) {
                return;
            }

            last = now;
            router.reload({ only: ['auth'] });
        };

        document.addEventListener('visibilitychange', refresh);
        window.addEventListener('online', refresh);

        return () => {
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener('online', refresh);
        };
    }, []);

    // Notifikasi belum dibaca yang belum diumumkan (mis. booking ditolak saat
    // user belum login, atau terlewat saat perangkat tidur) diumumkan setiap
    // kali datanya berubah, bukan hanya saat halaman dibuka. Daftar
    // `announced` mencegah bunyi dobel dengan jalur realtime di atas.
    useEffect(() => {
        const pending = (unreadNotifications ?? []).filter(
            (item: NotificationItem) => !readAnnounced().includes(item.id),
        );

        if (pending.length === 0) {
            return;
        }

        // Tunda sedikit agar <Toaster /> sudah terpasang sebelum toast dibuat.
        const timer = setTimeout(() => {
            // Jalur realtime mungkin sudah mengumumkannya selama jeda ini.
            const announced = readAnnounced();
            const fresh = pending.filter(
                (item: NotificationItem) => !announced.includes(item.id),
            );

            if (fresh.length === 0) {
                return;
            }

            fresh.slice(0, 3).forEach((item: NotificationItem) => {
                // Baris notifikasi lama bisa tidak punya `payload`; jangan
                // sampai satu baris itu mematikan popup dan suara semuanya.
                showPopup(
                    item.data.message ?? 'Notifikasi baru',
                    (item.data.payload as { status?: string } | undefined)
                        ?.status,
                );
            });

            if (fresh.length > 3) {
                toast.info(
                    `Dan ${fresh.length - 3} notifikasi belum dibaca lainnya`,
                );
            }

            flashTitle('Notifikasi Baru');
            playBeep();
            writeAnnounced([
                ...announced,
                ...fresh.map((i: NotificationItem) => i.id),
            ]);
        }, 800);

        return () => clearTimeout(timer);
    }, [unreadNotifications]);

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
    const handleMarkAsRead = async (notification: NotificationItem) => {
        router.visit(bookings.show(notification.data.payload.id as number));
        await fetch(notifications.markAsRead(notification.id).url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': _token,
            },
        });
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
                    <span className="text-sm font-semibold">Notifikasi</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto text-xs"
                            onClick={handleMarkAllAsRead}
                        >
                            Tandai semua dibaca
                        </Button>
                    )}
                </div>
                {items.length === 0 ? (
                    <div className="text-muted-foreground px-4 py-6 text-center text-sm">
                        Tidak ada notifikasi baru
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
                    </div>
                )}
                <DropdownMenuItem
                    className="flex cursor-pointer justify-center border-t px-4 py-2"
                    onClick={() => router.visit(notifications.index.url())}
                >
                    <span className="text-muted-foreground text-xs">
                        Lihat semua notifikasi ({unreadCount})
                    </span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
