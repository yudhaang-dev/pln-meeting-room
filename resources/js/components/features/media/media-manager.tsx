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
import roomGroupsMedia from '@/routes/room-groups/media';
import roomsMedia, { bulkDelete } from '@/routes/rooms/media';
import { MediaItemList } from './media-item-list';
import { MediaUploader } from './media-uploader';

type MediaItem = {
    id: number;
    path: string;
    type: string;
    name: string | null;
    sort_order: number;
    is_active: boolean;
    file_url: string | null;
};

type Props = {
    mediableType: 'rooms' | 'room-groups';
    mediableId: number;
    media: MediaItem[];
};

function getRoutes(mediableType: 'rooms' | 'room-groups', mediableId: number) {
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

    const routes = getRoutes(mediableType, mediableId);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMedia(initialMedia);
    }, [initialMedia]);

    const handleDeleteConfirm = () => {
        if (!deleteId) {
            return;
        }

        router.delete(routes.destroy(deleteId), {
            onSuccess: () => {
                setDeleteId(null);
            },
        });
    };

    const handleToggleActive = useCallback(
        (item: MediaItem) => {
            router.put(
                routes.toggleActive(item.id),
                {},
                {
                    preserveState: true,
                    replace: true,
                    onSuccess: () => {
                        setMedia((prev) =>
                            prev.map((i) =>
                                i.id === item.id
                                    ? { ...i, is_active: !i.is_active }
                                    : i,
                            ),
                        );
                    },
                },
            );
        },
        [routes],
    );

    const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
        setMedia((prev) => {
            const next = [...prev];
            const [removed] = next.splice(dragIndex, 1);
            next.splice(hoverIndex, 0, removed);

            return next;
        });
    }, []);

    const saveOrder = useCallback(() => {
        setMedia((prev) => {
            router.post(
                routes.reorder(),
                {
                    order: prev.map((m) => m.id),
                } as unknown as Record<string, string>,
                {
                    preserveState: true,
                    replace: true,
                },
            );

            return prev;
        });
    }, [routes]);

    const handleBulkDelete = (idValues: number[]) => {
        router.post(
            routes.bulkDelete(),
            {
                media_ids: idValues,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
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
                        onMoveItem={moveRow}
                        onMoveEnd={saveOrder}
                        onBulkDelete={handleBulkDelete}
                    />
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Media</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this media item?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
