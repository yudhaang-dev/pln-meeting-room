import { router } from '@inertiajs/react';
import { FileText, Trash2Icon, UploadIcon, XIcon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import infografis from '@/routes/infografis';
import roomGroupsMedia from '@/routes/room-groups/media';
import roomsMedia from '@/routes/rooms/media';
import type { MediaItem } from './media-manager';

type UploadFile = {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'done' | 'error';
};

type Props = {
    mediableType: 'rooms' | 'room-groups' | 'global';
    mediableId: number;
    setMedia: Dispatch<SetStateAction<MediaItem[]>>;
};

const CHUNK_SIZE = 5 * 1024 * 1024;
const ACCEPTED = 'image/*,video/*,application/pdf';

function getStoreUrl(
    mediableType: 'rooms' | 'room-groups' | 'global',
    mediableId: number,
): string {
    if (mediableType === 'global') {
        return infografis.store.url();
    }

    if (mediableType === 'rooms') {
        return roomsMedia.store.url(mediableId);
    }

    return roomGroupsMedia.store.url(mediableId);
}

function getCsrfToken(): string {
    return decodeURIComponent(
        document.cookie
            .split('; ')
            .find((c) => c.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ?? '',
    );
}

function isAcceptedFile(file: File): boolean {
    if (
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type === 'application/pdf'
    ) {
        return true;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();

    return [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg',
        'mp4',
        'webm',
        'ogg',
        'mov',
        'pdf',
    ].includes(ext ?? '');
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function MediaUploader({ mediableType, mediableId, setMedia }: Props) {
    const [uploads, setUploads] = useState<UploadFile[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const isUploading = uploads.some((u) => u.status === 'uploading');

    const updateUpload = useCallback(
        (id: string, patch: Partial<UploadFile>) => {
            setUploads((prev) =>
                prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
            );
        },
        [],
    );

    const removeUpload = useCallback((id: string) => {
        setUploads((prev) => prev.filter((u) => u.id !== id));
    }, []);

    async function uploadViaForm(id: string, file: File) {
        updateUpload(id, { status: 'uploading', progress: 0 });

        const formData = new FormData();
        formData.append('files[]', file);

        return new Promise<void>((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', getStoreUrl(mediableType, mediableId));
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('X-XSRF-TOKEN', getCsrfToken());

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    updateUpload(id, {
                        progress: Math.min(
                            Math.round((e.loaded / e.total) * 100),
                            99,
                        ),
                    });
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    updateUpload(id, { status: 'done', progress: 100 });

                    try {
                        const json = JSON.parse(xhr.responseText);
                        const flashMedia = json?.props?.media as
                            MediaItem[] | undefined;

                        if (flashMedia && Array.isArray(flashMedia)) {
                            setMedia((prev) => [...prev, ...flashMedia]);
                        }
                    } catch {
                        // Inertia HTML response — trigger partial reload for this page
                        router.reload({
                            only:
                                mediableType === 'global'
                                    ? ['media']
                                    : ['room', 'roomGroup'],
                        });
                    }

                    toast.success(`${file.name} uploaded.`);
                } else {
                    updateUpload(id, { status: 'error', progress: 0 });
                    toast.error(`Failed to upload ${file.name}.`);
                }

                resolve();
            };

            xhr.onerror = () => {
                updateUpload(id, { status: 'error', progress: 0 });
                toast.error(`Failed to upload ${file.name}.`);
                resolve();
            };

            xhr.send(formData);
        });
    }

    async function uploadViaChunk(id: string, file: File) {
        updateUpload(id, { status: 'uploading', progress: 0 });

        const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        try {
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('upload_id', uploadId);
                formData.append('index', String(i));
                formData.append('total_chunks', String(totalChunks));
                formData.append('file', chunk, file.name);

                const response = await fetch('/media/chunk', {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': getCsrfToken(),
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Chunk ${i} upload failed`);
                }

                updateUpload(id, {
                    progress: Math.round(((i + 1) / (totalChunks + 1)) * 100),
                });
            }

            const assembleResponse = await fetch('/media/assemble', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    upload_id: uploadId,
                    mediable_type: mediableType,
                    mediable_id: mediableId,
                    original_name: file.name,
                    mime_type: file.type,
                    total_chunks: totalChunks,
                }),
            });

            if (!assembleResponse.ok) {
                throw new Error('Assembly failed');
            }

            const result = (await assembleResponse.json()) as {
                media: MediaItem;
            };
            setMedia((prev) => [...prev, result.media]);
            updateUpload(id, { status: 'done', progress: 100 });
            toast.success(`${file.name} uploaded.`);
        } catch {
            updateUpload(id, { status: 'error', progress: 0 });
            toast.error(`Failed to upload ${file.name}.`);
        }
    }

    const uploadFile = useCallback(
        async (upload: UploadFile) => {
            const { id, file } = upload;

            if (file.size > CHUNK_SIZE) {
                await uploadViaChunk(id, file);
            } else {
                await uploadViaForm(id, file);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [mediableType, mediableId],
    );

    const handleFiles = useCallback(
        (files: File[]) => {
            const accepted = files.filter(isAcceptedFile);

            if (accepted.length === 0) {
                toast.error('No supported files selected.');

                return;
            }

            const newUploads: UploadFile[] = accepted.map((file) => ({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                file,
                progress: 0,
                status: 'pending' as const,
            }));

            setUploads((prev) => [...prev, ...newUploads]);

            // Process sequentially to avoid overwhelming the server
            void (async () => {
                for (const upload of newUploads) {
                    await uploadFile(upload);
                }
            })();
        },
        [uploadFile],
    );

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        handleFiles(Array.from(e.dataTransfer.files));
    }

    return (
        <div className="space-y-3">
            <div
                className="border-muted-foreground/25 hover:border-muted-foreground/50 relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Spinner />
                        <span className="text-muted-foreground text-sm">
                            Uploading...
                        </span>
                    </div>
                ) : (
                    <>
                        <UploadIcon className="text-muted-foreground mb-2 size-8" />
                        <p className="text-muted-foreground mb-1 text-sm">
                            Drag & drop or{' '}
                            <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => inputRef.current?.click()}
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Images, videos and PDFs (large files supported via
                            chunk upload)
                        </p>
                    </>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept={ACCEPTED}
                    onChange={(e) => {
                        handleFiles(Array.from(e.target.files ?? []));

                        if (inputRef.current) {
                            inputRef.current.value = '';
                        }
                    }}
                />
            </div>

            {uploads.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-xs">
                            {uploads.length} file{uploads.length > 1 ? 's' : ''}
                            :{' '}
                            {uploads.filter((u) => u.status === 'done').length}{' '}
                            done
                            {uploads.some(
                                (u) =>
                                    u.status === 'uploading' ||
                                    u.status === 'pending',
                            ) && (
                                <>
                                    ,{' '}
                                    {
                                        uploads.filter(
                                            (u) =>
                                                u.status === 'uploading' ||
                                                u.status === 'pending',
                                        ).length
                                    }{' '}
                                    in progress
                                </>
                            )}
                            {uploads.some((u) => u.status === 'error') && (
                                <>
                                    ,{' '}
                                    {
                                        uploads.filter(
                                            (u) => u.status === 'error',
                                        ).length
                                    }{' '}
                                    failed
                                </>
                            )}
                        </p>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                                setUploads((prev) =>
                                    prev.filter(
                                        (u) =>
                                            u.status === 'uploading' ||
                                            u.status === 'pending',
                                    ),
                                )
                            }
                        >
                            <Trash2Icon className="size-3" />
                        </Button>
                    </div>
                    {uploads.map((upload) => (
                        <UploadItem
                            key={upload.id}
                            upload={upload}
                            onRemove={removeUpload}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function UploadItem({
    upload,
    onRemove,
}: {
    upload: UploadFile;
    onRemove: (id: string) => void;
}) {
    const { id, file, progress, status } = upload;
    const isPdf = file.type === 'application/pdf';

    return (
        <div className="bg-card flex items-center gap-3 rounded-lg border px-3 py-2">
            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                {isPdf ? (
                    <FileText className="text-muted-foreground size-4" />
                ) : file.type.startsWith('image/') ? (
                    <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="size-8 rounded-md object-cover"
                    />
                ) : (
                    <FileText className="text-muted-foreground size-4" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                        {formatFileSize(file.size)}
                    </span>
                    {status === 'uploading' && (
                        <span className="text-muted-foreground text-xs">
                            {progress}%
                        </span>
                    )}
                    {status === 'done' && (
                        <span className="text-muted-foreground text-xs">
                            Done
                        </span>
                    )}
                    {status === 'error' && (
                        <span className="text-destructive text-xs">Failed</span>
                    )}
                </div>
                {(status === 'uploading' || status === 'pending') && (
                    <Progress value={progress} className="mt-1" />
                )}
            </div>
            <div className="shrink-0">
                {status === 'uploading' || status === 'pending' ? (
                    <Spinner className="size-4" />
                ) : (
                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => onRemove(id)}
                    >
                        <XIcon className="size-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
