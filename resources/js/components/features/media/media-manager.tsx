import { router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import infografis from '@/routes/infografis';
import roomGroupsMedia from '@/routes/room-groups/media';
import roomsMedia from '@/routes/rooms/media';
import { MediaItemList } from './media-item-list';
import { MediaUploader } from './media-uploader';

export type MediaItem = {
    id: number;
    path: string;
    type: string;
    name: string | null;
    size: number;
    mime: string | null;
    sort_order: number;
    is_active: boolean;
    file_url: string | null;
};

type Props = {
    mediableType: 'rooms' | 'room-groups' | 'global';
    mediableId: number;
    media: MediaItem[];
};

function getRoutes(
    mediableType: 'rooms' | 'room-groups' | 'global',
    mediableId: number,
) {
    if (mediableType === 'global') {
        return {
            store: () => infografis.store(),
            reorder: () => infografis.reorder(),
            bulkDelete: () => infografis.bulkDelete(),
            toggleActive: (mediaId: number) => infografis.toggleActive(mediaId),
            destroy: (mediaId: number) => infografis.destroy(mediaId),
        };
    }

    if (mediableType === 'rooms') {
        return {
            store: () => roomsMedia.store(mediableId),
            reorder: () => roomsMedia.reorder(mediableId),
            bulkDelete: () => roomsMedia.bulkDelete(mediableId),
            toggleActive: (mediaId: number) =>
                roomsMedia.toggleActive([mediableId, mediaId]),
            destroy: (mediaId: number) =>
                roomsMedia.destroy([mediableId, mediaId]),
        };
    }

    return {
        store: () => roomGroupsMedia.store(mediableId),
        reorder: () => roomGroupsMedia.reorder(mediableId),
        bulkDelete: () => roomGroupsMedia.bulkDelete(mediableId),
        toggleActive: (mediaId: number) =>
            roomGroupsMedia.toggleActive([mediableId, mediaId]),
        destroy: (mediaId: number) =>
            roomGroupsMedia.destroy([mediableId, mediaId]),
    };
}

export function MediaManager({
    mediableType,
    mediableId,
    media: initialMedia,
}: Props) {
    const [media, setMedia] = useState(initialMedia);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null);
    const [processing, setProcessing] = useState(false);

    const routes = getRoutes(mediableType, mediableId);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMedia(initialMedia);
    }, [initialMedia]);

    const handleDeleteConfirm = () => {
        if (!deleteId) {
            return;
        }

        setProcessing(true);
        router.delete(routes.destroy(deleteId), {
            onFinish: () => setProcessing(false),
            onSuccess: () => setDeleteId(null),
        });
    };

    const handleBulkDeleteConfirm = () => {
        if (!bulkDeleteIds || bulkDeleteIds.length === 0) {
            return;
        }

        setProcessing(true);
        const idsToDelete = bulkDeleteIds;

        router.post(
            routes.bulkDelete(),
            { media_ids: idsToDelete },
            {
                preserveState: true,
                replace: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setMedia((prev) =>
                        prev.filter((i) => !idsToDelete.includes(i.id)),
                    );
                    setBulkDeleteIds(null);
                },
            },
        );
    };

    const handleToggleActive = useCallback(
        (item: MediaItem) => {
            const previousState = item.is_active;

            setMedia((prev) =>
                prev.map((i) =>
                    i.id === item.id ? { ...i, is_active: !i.is_active } : i,
                ),
            );

            router.put(
                routes.toggleActive(item.id),
                {},
                {
                    preserveState: true,
                    replace: true,
                    onError: () => {
                        setMedia((prev) =>
                            prev.map((i) =>
                                i.id === item.id
                                    ? { ...i, is_active: previousState }
                                    : i,
                            ),
                        );
                    },
                },
            );
        },
        [routes],
    );

    const handleReorder = useCallback(
        (next: MediaItem[]) => {
            const ordered = next.map((item, index) => ({
                ...item,
                sort_order: index + 1,
            }));

            setMedia(ordered);

            router.post(
                routes.reorder(),
                {
                    order: ordered.map((m) => m.id),
                } as unknown as Record<string, string>,
                {
                    preserveState: true,
                    replace: true,
                },
            );
        },
        [routes],
    );

    const handleBulkDelete = (idValues: number[]) => {
        setBulkDeleteIds(idValues);
    };

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="w-full space-y-4">
                    <MediaUploader
                        mediableType={mediableType}
                        mediableId={mediableId}
                        setMedia={setMedia}
                    />
                </div>
                <div className="w-full md:col-span-2">
                    <MediaItemList
                        items={media}
                        onToggleActive={handleToggleActive}
                        onRemoveItem={(item) => setDeleteId(item.id)}
                        onReorder={handleReorder}
                        onBulkDelete={handleBulkDelete}
                    />
                </div>
            </div>

            {/* Single Delete Dialog */}
            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Media</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus media ini?
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Dialog */}
            <Dialog
                open={bulkDeleteIds !== null}
                onOpenChange={(open) => !open && setBulkDeleteIds(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Beberapa Media</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus{' '}
                            {bulkDeleteIds?.length} media? Tindakan ini tidak
                            dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBulkDeleteIds(null)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBulkDeleteConfirm}
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Hapus Semua
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
