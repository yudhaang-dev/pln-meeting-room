<?php

namespace App\Http\Controllers\Web;

use App\Events\MediaUpdated;
use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Room;
use App\Models\RoomGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MediaController extends Controller
{
    public function store(Room $room): RedirectResponse
    {
        return $this->doStore($room);
    }

    public function storeFromGrouping(RoomGroup $roomGroup): RedirectResponse
    {
        return $this->doStore($roomGroup);
    }

    private function doStore(Room|RoomGroup $mediable): RedirectResponse
    {
        $this->authorize('create', Media::class);

        request()->validate([
            'files' => ['required', 'array'],
            'files.*' => ['file', 'max:51200'],
        ]);

        $maxSort = $mediable->media()->max('sort_order') ?? 0;
        $files = request()->file('files');
        $created = [];

        foreach ($files as $index => $file) {
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $name = Str::random(40).'.'.$file->getClientOriginalExtension();
            $stream = fopen($file->getPathname(), 'r');
            Storage::disk('public')->put('media/'.$name, $stream);
            fclose($stream);

            $created[] = Media::create([
                'mediable_type' => $mediable::class,
                'mediable_id' => $mediable->id,
                'path' => 'media/'.$name,
                'type' => $this->determineFileType($file->getClientOriginalExtension()),
                'name' => $originalName,
                'size' => $file->getSize(),
                'mime' => $file->getClientMimeType(),
                'sort_order' => $maxSort + $index + 1,
                'is_active' => true,
            ]);
        }

        foreach ($created as $media) {
            broadcast(new MediaUpdated($media));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => count($created).' media uploaded.']);
        Inertia::flash('media', collect($created)->map(fn ($m) => $m->only(['id', 'type', 'name', 'path', 'size', 'mime', 'sort_order', 'is_active', 'file_url']))->all());

        return back();
    }

    public function chunk(): JsonResponse
    {
        $validated = request()->validate([
            'upload_id' => ['required', 'string', 'max:64'],
            'index' => ['required', 'integer', 'min:0'],
            'total_chunks' => ['required', 'integer', 'min:1'],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $disk = Storage::disk('local');
        $chunkDir = 'uploads/chunks/'.$validated['upload_id'];
        $chunkPath = $chunkDir.'/'.$validated['index'];

        if (! $disk->exists($chunkDir)) {
            $disk->makeDirectory($chunkDir);
        }

        $stream = fopen(request()->file('file')->getPathname(), 'r');
        $disk->put($chunkPath, $stream);
        fclose($stream);

        return response()->json([
            'uploaded' => $validated['index'] + 1,
            'total' => $validated['total_chunks'],
        ]);
    }

    public function assemble(): JsonResponse
    {
        $validated = request()->validate([
            'upload_id' => ['required', 'string', 'max:64'],
            'mediable_type' => ['required', 'string', 'in:rooms,room-groups'],
            'mediable_id' => ['required', 'integer'],
            'original_name' => ['required', 'string', 'max:255'],
            'mime_type' => ['required', 'string', 'max:128'],
            'total_chunks' => ['required', 'integer', 'min:1'],
        ]);

        $chunkDir = 'uploads/chunks/'.$validated['upload_id'];
        $localDisk = Storage::disk('local');

        $mediable = $validated['mediable_type'] === 'rooms'
            ? Room::findOrFail($validated['mediable_id'])
            : RoomGroup::findOrFail($validated['mediable_id']);

        $extension = pathinfo($validated['original_name'], PATHINFO_EXTENSION);
        $originalFilename = pathinfo($validated['original_name'], PATHINFO_FILENAME);
        $name = Str::random(40).'.'.$extension;
        $finalPath = 'media/'.$name;

        $targetPath = Storage::disk('public')->path($finalPath);
        $target = fopen($targetPath, 'wb');
        if ($target === false) {
            return response()->json(['message' => 'Could not open target file.'], 500);
        }

        for ($i = 0; $i < $validated['total_chunks']; $i++) {
            $relativeChunkPath = $chunkDir.'/'.$i;
            if (! $localDisk->exists($relativeChunkPath)) {
                fclose($target);

                return response()->json(['message' => "Chunk {$i} not found."], 422);
            }
            $chunk = fopen($localDisk->path($relativeChunkPath), 'rb');
            stream_copy_to_stream($chunk, $target);
            fclose($chunk);
        }

        fclose($target);

        $maxSort = $mediable->media()->max('sort_order') ?? 0;
        $media = Media::create([
            'mediable_type' => $mediable::class,
            'mediable_id' => $mediable->id,
            'path' => $finalPath,
            'type' => $this->determineFileType($extension),
            'name' => $originalFilename,
            'mime' => $validated['mime_type'],
            'sort_order' => $maxSort + 1,
            'is_active' => true,
        ]);

        $this->cleanupChunks($validated['upload_id']);

        broadcast(new MediaUpdated($media));

        return response()->json([
            'media' => $media->only(['id', 'type', 'name', 'path', 'size', 'mime', 'sort_order', 'is_active', 'file_url']),
        ]);
    }

    public function reorder(): RedirectResponse
    {
        $order = request()->input('order', []);

        foreach ($order as $index => $mediaId) {
            Media::where('id', $mediaId)->update(['sort_order' => $index + 1]);
        }

        if (count($order) > 0) {
            $media = Media::with('mediable')->find($order[0]);

            if ($media) {
                broadcast(new MediaUpdated($media));
            }
        }

        return back();
    }

    public function toggleActive(mixed $parent, Media $media): RedirectResponse
    {
        $media->update(['is_active' => ! $media->is_active]);

        broadcast(new MediaUpdated($media));

        return back();
    }

    public function destroy(mixed $parent, Media $media): RedirectResponse
    {
        $this->authorize('delete', $media);

        $media->load('mediable');
        broadcast(new MediaUpdated($media));

        $media->deleteFile();
        $media->delete();
        $this->resequenceSortOrder($media->mediable);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Media deleted.']);

        return back();
    }

    public function bulkDelete(Room $room): RedirectResponse
    {
        return $this->doBulkDelete($room);
    }

    public function bulkDeleteFromGrouping(RoomGroup $roomGroup): RedirectResponse
    {
        return $this->doBulkDelete($roomGroup);
    }

    private function doBulkDelete(Room|RoomGroup $mediable): RedirectResponse
    {
        $mediaIds = request()->input('media_ids', []);

        $mediaItems = Media::whereIn('id', $mediaIds)
            ->where('mediable_type', $mediable::class)
            ->where('mediable_id', $mediable->id)
            ->with('mediable')
            ->get();

        foreach ($mediaItems as $media) {
            $this->authorize('delete', $media);
            broadcast(new MediaUpdated($media));
            $media->deleteFile();
            $media->delete();
        }

        $first = $mediaItems->first();
        if ($first !== null) {
            $this->resequenceSortOrder($first->mediable);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => count($mediaItems).' media deleted.']);

        return back();
    }

    private function resequenceSortOrder(Room|RoomGroup $mediable): void
    {
        $items = $mediable->media()->orderBy('sort_order')->get();
        foreach ($items as $index => $item) {
            $item->updateQuietly(['sort_order' => $index + 1]);
        }
    }

    private function determineFileType(string $extension): string
    {
        return match (strtolower($extension)) {
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg' => 'image',
            'mp4', 'webm', 'ogg', 'mov' => 'video',
            'pdf' => 'document',
            default => 'document',
        };
    }

    private function cleanupChunks(string $uploadId): void
    {
        $disk = Storage::disk('local');
        $chunkDir = 'uploads/chunks/'.$uploadId;
        $files = $disk->files($chunkDir);
        foreach ($files as $file) {
            $disk->delete($file);
        }
        $disk->deleteDirectory($chunkDir);
    }
}
