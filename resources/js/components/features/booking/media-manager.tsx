import { router } from '@inertiajs/react';
import {
    FileText,
    Film,
    GripVertical,
    Image as ImageIcon,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createUploadQueue } from '@/lib/chunked-upload';
import type { UploadFile } from '@/lib/chunked-upload';
import roomGroupsMedia from '@/routes/room-groups/media';
import roomsMedia from '@/routes/rooms/media';

type MediaItem = {
    id: number;
    path: string;
    type: string;
    name: string | null;
    sort_order: number;
    is_active: boolean;
    file_url: string | null;
};

type DragItem = {
    index: number;
};

type Props = {
    mediableType: 'rooms' | 'room-groups';
    mediableId: number;
    media: MediaItem[];
};

const ITEM_TYPE = 'media-item';

function DraggableRow({
    item,
    index,
    onDelete,
    onToggleActive,
    moveRow,
    saveOrder,
}: {
    item: MediaItem;
    index: number;
    onDelete: (id: number) => void;
    onToggleActive: (item: MediaItem) => void;
    moveRow: (dragIndex: number, hoverIndex: number) => void;
    saveOrder: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag, preview] = useDrag<
        DragItem,
        void,
        { isDragging: boolean }
    >({
        type: ITEM_TYPE,
        item: () => ({ index }),
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        end: () => {
            saveOrder();
        },
    });

    const [, drop] = useDrop<DragItem, void, void>({
        accept: ITEM_TYPE,
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                moveRow(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    // eslint-disable-next-line react-hooks/refs
    drag(drop(ref));

    const getIcon = (fileType: string) => {
        switch (fileType) {
            case 'image':
                return <ImageIcon className="size-4" />;
            case 'video':
                return <Film className="size-4" />;
            default:
                return <FileText className="size-4" />;
        }
    };

    return (
        <div
            ref={(node) => {
                preview(node);
            }}
            className={`flex items-center gap-3 p-3 ${isDragging ? 'opacity-50' : ''} ${!item.is_active ? 'opacity-60' : ''}`}
        >
            <div
                ref={ref}
                className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="size-4" />
            </div>

            <div className="bg-muted size-12 shrink-0 overflow-hidden rounded border">
                {item.type === 'image' && item.file_url ? (
                    <img
                        src={item.file_url}
                        alt={item.name ?? item.path}
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="text-muted-foreground flex size-full items-center justify-center">
                        {getIcon(item.type)}
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    {item.name ?? item.path.split('/').pop()}
                </p>
                <p className="text-muted-foreground text-xs capitalize">
                    {item.type}
                </p>
            </div>

            <span className="text-muted-foreground text-xs">
                #{item.sort_order}
            </span>

            <Switch
                checked={item.is_active}
                onCheckedChange={() => onToggleActive(item)}
            />

            <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(item.id)}
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

function UploadProgressItem({
    uploadFile,
    onRemove,
}: {
    uploadFile: UploadFile;
    onRemove: (id: string) => void;
}) {
    const getStatusLabel = (status: UploadFile['status']) => {
        switch (status) {
            case 'pending':
                return 'Waiting...';
            case 'uploading':
                return `Uploading... ${uploadFile.progress}%`;
            case 'assembling':
                return 'Processing...';
            case 'done':
                return 'Done';
            case 'error':
                return uploadFile.error ?? 'Failed';
        }
    };

    const getIcon = (name: string) => {
        if (name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return <ImageIcon className="size-4" />;
        }

        if (name.match(/\.(mp4|webm|ogg|mov)$/i)) {
            return <Film className="size-4" />;
        }

        return <FileText className="size-4" />;
    };

    return (
        <div className="flex items-center gap-3 rounded border p-2">
            <div className="text-muted-foreground">
                {getIcon(uploadFile.name)}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{uploadFile.name}</p>
                <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                    <div
                        className={`h-full rounded-full transition-all ${
                            uploadFile.status === 'error'
                                ? 'bg-destructive'
                                : uploadFile.status === 'done'
                                  ? 'bg-green-500'
                                  : 'bg-primary'
                        }`}
                        style={{ width: `${uploadFile.progress}%` }}
                    />
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                    {getStatusLabel(uploadFile.status)}
                </p>
            </div>
            {uploadFile.status !== 'uploading' &&
                uploadFile.status !== 'assembling' && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(uploadFile.id)}
                    >
                        <X className="size-4" />
                    </Button>
                )}
        </div>
    );
}

function getRoutes(mediableType: 'rooms' | 'room-groups', mediableId: number) {
    if (mediableType === 'rooms') {
        return {
            store: () => roomsMedia.store(mediableId),
            reorder: () => roomsMedia.reorder(mediableId),
            toggleActive: (mediaId: number) =>
                roomsMedia.toggleActive([mediableId, mediaId]),
            destroy: (mediaId: number) =>
                roomsMedia.destroy([mediableId, mediaId]),
        };
    }

    return {
        store: () => roomGroupsMedia.store(mediableId),
        reorder: () => roomGroupsMedia.reorder(mediableId),
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
    const [uploadItems, setUploadItems] = useState<UploadFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadQueueRef = useRef<ReturnType<typeof createUploadQueue> | null>(
        null,
    );

    const routes = getRoutes(mediableType, mediableId);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMedia(initialMedia);
    }, [initialMedia]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (files && files.length > 0) {
            startUpload(Array.from(files));
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const startUpload = (files: File[]) => {
        const queue = createUploadQueue(mediableType, mediableId, {
            onProgress: (fileId, progress) => {
                setUploadItems((prev) =>
                    prev.map((item) =>
                        item.id === fileId ? { ...item, progress } : item,
                    ),
                );
            },
            onFileStatusChange: (fileId, status) => {
                setUploadItems((prev) =>
                    prev.map((item) =>
                        item.id === fileId ? { ...item, status } : item,
                    ),
                );
            },
            onComplete: (_, mediaItem) => {
                setMedia((prev) => [
                    ...prev,
                    mediaItem as unknown as MediaItem,
                ]);
            },
            onError: () => {},
        });

        uploadQueueRef.current = queue;
        queue.add(files);
        setUploadItems(queue.getQueue());
    };

    const removeUploadItem = (id: string) => {
        setUploadItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary', 'bg-muted/50');
        const files = Array.from(e.dataTransfer.files);

        if (files.length > 0) {
            startUpload(files);
        }
    };

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

    const handleToggleActive = (item: MediaItem) => {
        router.put(
            routes.toggleActive(item.id),
            {},
            {
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setMedia((prev) =>
                        prev.map((m) =>
                            m.id === item.id
                                ? { ...m, is_active: !m.is_active }
                                : m,
                        ),
                    );
                },
            },
        );
    };

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

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="grid gap-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                        Media ({media.length})
                    </Label>
                </div>

                <div className="grid gap-2">
                    <div
                        className="hover:border-primary/50 hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add(
                                'border-primary',
                                'bg-muted/50',
                            );
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove(
                                'border-primary',
                                'bg-muted/50',
                            );
                        }}
                        onDrop={handleDrop}
                    >
                        <Upload className="text-muted-foreground mb-2 size-6" />
                        <p className="text-muted-foreground text-sm">
                            Click or drag files to upload
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Images, videos, or PDFs (max 50MB each)
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {uploadItems.length > 0 && (
                    <div className="grid gap-2">
                        <Label>Uploading ({uploadItems.length})</Label>
                        <div className="max-h-48 divide-y overflow-y-auto rounded-md border">
                            {uploadItems.map((item) => (
                                <UploadProgressItem
                                    key={item.id}
                                    uploadFile={item}
                                    onRemove={removeUploadItem}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {media.length > 0 && (
                    <div className="rounded-md border">
                        <div className="divide-y">
                            {media.map((item, index) => (
                                <DraggableRow
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onDelete={(id) => setDeleteId(id)}
                                    onToggleActive={handleToggleActive}
                                    moveRow={moveRow}
                                    saveOrder={saveOrder}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {media.length === 0 && uploadItems.length === 0 && (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                        No media uploaded yet.
                    </p>
                )}
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
        </DndProvider>
    );
}
