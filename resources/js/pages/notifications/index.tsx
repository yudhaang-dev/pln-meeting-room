import { router } from '@inertiajs/react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatTime } from '@/lib/utils';
import notifications from '@/routes/notifications';

type NotificationData = {
    message: string;
    resource: string;
    payload: {
        id: number;
        title: string;
        room?: string | null;
        start_time: string;
        end_time: string;
        status: string;
    };
};

type Notification = {
    id: string;
    type: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
};

type PaginatedNotifications = {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Props = {
    notifications: PaginatedNotifications;
};

export default function NotificationsIndex({
    notifications: paginatedNotifications,
}: Props) {
    const handleMarkAllAsRead = () => {
        router.post(
            notifications.markAllAsRead.url(),
            {},
            { preserveScroll: true },
        );
    };

    const handleMarkAsRead = (id: string) => {
        router.post(
            notifications.markAsRead(id).url,
            {},
            { preserveScroll: true },
        );
    };

    const handleClearAll = () => {
        router.patch(notifications.clear.url(), {}, { preserveScroll: true });
    };

    const handleDelete = (id: string) => {
        router.delete(notifications.destroy(id).url, { preserveScroll: true });
    };

    return (
        <PageContainer>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Notifikasi</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        render={<button onClick={handleMarkAllAsRead} />}
                    >
                        <CheckCheck className="mr-1 size-4" />
                        Tandai semua dibaca
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        render={<button onClick={handleClearAll} />}
                    >
                        <Trash2 className="mr-1 size-4" />
                        Bersihkan semua
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent>
                    {paginatedNotifications.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <Bell className="text-muted-foreground mx-auto mb-4 size-12" />
                            <p className="text-muted-foreground text-sm">
                                Belum ada notifikasi.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {paginatedNotifications.data.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 px-4 py-3 ${notification.read_at ? 'opacity-60' : ''}`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm">
                                            {notification.data.message}
                                        </p>
                                        {notification.data.payload && (
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {notification.data.payload.room}{' '}
                                                &middot;{' '}
                                                {formatDate(
                                                    notification.data.payload
                                                        .start_time,
                                                )}{' '}
                                                {formatTime(
                                                    notification.data.payload
                                                        .start_time,
                                                )}{' '}
                                                -{' '}
                                                {formatTime(
                                                    notification.data.payload
                                                        .end_time,
                                                )}
                                            </p>
                                        )}
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {formatDate(
                                                notification.created_at,
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        {!notification.read_at && (
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                render={
                                                    <button
                                                        onClick={() =>
                                                            handleMarkAsRead(
                                                                notification.id,
                                                            )
                                                        }
                                                    />
                                                }
                                            >
                                                <Check className="size-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() =>
                                                handleDelete(notification.id)
                                            }
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </PageContainer>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Notifikasi',
            href: notifications.index(),
        },
    ],
};
