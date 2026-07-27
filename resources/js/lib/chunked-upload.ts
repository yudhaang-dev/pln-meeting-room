import mediaRoutes from '@/routes/media';

const CHUNK_SIZE = 2 * 1024 * 1024;

type UploadFile = {
    id: string;
    file: File;
    name: string;
    totalChunks: number;
    uploadedChunks: number;
    progress: number;
    status: 'pending' | 'uploading' | 'assembling' | 'done' | 'error';
    error?: string;
};

type UploadCallbacks = {
    onProgress: (fileId: string, progress: number) => void;
    onFileStatusChange: (fileId: string, status: UploadFile['status']) => void;
    onComplete: (fileId: string, media: Record<string, unknown>) => void;
    onError: (fileId: string, error: string) => void;
};

function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function sliceFile(file: File): Blob[] {
    const chunks: Blob[] = [];
    let start = 0;

    while (start < file.size) {
        chunks.push(file.slice(start, start + CHUNK_SIZE));
        start += CHUNK_SIZE;
    }

    return chunks;
}

async function uploadChunk(
    uploadId: string,
    chunkIndex: number,
    totalChunks: number,
    chunk: Blob,
): Promise<{ uploaded: number; total: number }> {
    const formData = new FormData();
    formData.append('upload_id', uploadId);
    formData.append('index', String(chunkIndex));
    formData.append('total_chunks', String(totalChunks));
    formData.append('file', chunk, 'chunk');

    const response = await fetch(mediaRoutes.chunk.url(), {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': decodeURIComponent(
                document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
            ),
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: 'Upload failed' }));

        throw new Error(error.message || 'Upload failed');
    }

    return response.json();
}

async function assembleChunks(
    uploadId: string,
    mediableType: 'rooms' | 'room-groups',
    mediableId: number,
    file: File,
    totalChunks: number,
): Promise<Record<string, unknown>> {
    const response = await fetch(mediaRoutes.assemble.url(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': decodeURIComponent(
                document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
            ),
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

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: 'Assembly failed' }));

        throw new Error(error.message || 'Assembly failed');
    }

    const result = await response.json();

    return result.media;
}

export function createUploadQueue(
    mediableType: 'rooms' | 'room-groups',
    mediableId: number,
    callbacks: UploadCallbacks,
) {
    const queue: UploadFile[] = [];

    async function processFile(uploadFile: UploadFile) {
        const { file, id, totalChunks } = uploadFile;
        const chunks = sliceFile(file);
        const uploadId = generateId();

        uploadFile.status = 'uploading';
        callbacks.onFileStatusChange(id, 'uploading');

        try {
            for (let i = 0; i < chunks.length; i++) {
                await uploadChunk(uploadId, i, totalChunks, chunks[i]);
                uploadFile.uploadedChunks = i + 1;
                uploadFile.progress = Math.round(((i + 1) / totalChunks) * 100);
                callbacks.onProgress(id, uploadFile.progress);
            }

            uploadFile.status = 'assembling';
            callbacks.onFileStatusChange(id, 'assembling');

            const media = await assembleChunks(
                uploadId,
                mediableType,
                mediableId,
                file,
                totalChunks,
            );

            uploadFile.status = 'done';
            uploadFile.progress = 100;
            callbacks.onFileStatusChange(id, 'done');
            callbacks.onProgress(id, 100);
            callbacks.onComplete(id, media);
        } catch (err) {
            uploadFile.status = 'error';
            uploadFile.error =
                err instanceof Error ? err.message : 'Upload failed';
            callbacks.onFileStatusChange(id, 'error');
            callbacks.onError(id, uploadFile.error);
        }
    }

    return {
        add(files: File[]) {
            for (const file of files) {
                const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                const uploadFile: UploadFile = {
                    id: generateId(),
                    file,
                    name: file.name,
                    totalChunks,
                    uploadedChunks: 0,
                    progress: 0,
                    status: 'pending',
                };
                queue.push(uploadFile);
                processFile(uploadFile);
            }
        },
        getQueue() {
            return queue;
        },
    };
}

export type { UploadFile };
