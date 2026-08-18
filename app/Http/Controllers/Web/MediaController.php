<?php

namespace App\Http\Controllers\Web;

use App\Events\PublicBroadcast;
use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Room;
use App\Models\RoomGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function indexGlobal(): Response
    {
        $this->authorize('viewAny', Media::class);

        return Inertia::render('infografis/index', [
            'media' => Media::global()->orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function store(Room $room): RedirectResponse
    {
        return $this->doStore($room);
    }

    public function storeFromGrouping(RoomGroup $roomGroup): RedirectResponse
    {
        return $this->doStore($roomGroup);
    }

    public function storeGlobal(): RedirectResponse
    {
        return $this->catchErrors(function () {
            $this->authorize('create', Media::class);

            request()->validate([
                'files' => ['required', 'array'],
                'files.*' => ['file', 'max:51200'],
            ]);

            $maxSort = Media::global()->max('sort_order') ?? 0;
            $files = request()->file('files');
            $created = [];

            foreach ($files as $index => $file) {
                $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $name = Str::random(40).'.'.$file->getClientOriginalExtension();
                $stream = fopen($file->getPathname(), 'r');
                if ($stream === false) {
                    Inertia::flash('toast', ['type' => 'error', 'message' => 'Could not read the uploaded file.']);

                    return back();
                }
                Storage::disk('public')->put('media/'.$name, $stream);
                fclose($stream);

                $created[] = Media::create([
                    'mediable_type' => null,
                    'mediable_id' => null,
                    'path' => 'media/'.$name,
                    'type' => $this->determineFileType($file->getClientOriginalExtension()),
                    'name' => $originalName,
                    'size' => $file->getSize(),
                    'mime' => $file->getClientMimeType(),
                    'sort_order' => $maxSort + $index + 1,
                    'is_active' => true,
                ]);
            }

            if (count($created) > 0) {
                $this->broadcastMediaUpdated($created[0]);
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => count($created).' media uploaded.']);
            Inertia::flash('media', collect($created)->map(fn ($m) => $m->only(['id', 'type', 'name', 'path', 'size', 'mime', 'sort_order', 'is_active', 'file_url']))->all());

            return back();
        }, __('Failed to upload media.'));
    }

    private function doStore(Room|RoomGroup $mediable): RedirectResponse
    {
        return $this->catchErrors(function () use ($mediable) {
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
                if ($stream === false) {
                    Inertia::flash('toast', ['type' => 'error', 'message' => 'Could not read the uploaded file.']);

                    return back();
                }
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

            if (count($created) > 0) {
                $this->broadcastMediaUpdated($created[0]);
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => count($created).' media uploaded.']);
            Inertia::flash('media', collect($created)->map(fn ($m) => $m->only(['id', 'type', 'name', 'path', 'size', 'mime', 'sort_order', 'is_active', 'file_url']))->all());

            return back();
        }, __('Failed to upload media.'));
    }

    public function chunk(): JsonResponse
    {
        return $this->catchErrorsJson(function () {
            $this->authorize('create', Media::class);

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
            if ($stream === false) {
                return response()->json(['message' => 'Could not read the uploaded chunk.'], 500);
            }
            $disk->put($chunkPath, $stream);
            fclose($stream);

            return response()->json([
                'uploaded' => $validated['index'] + 1,
                'total' => $validated['total_chunks'],
            ]);
        }, 'Failed to upload chunk.');
    }

    public function assemble(): JsonResponse
    {
        return $this->catchErrorsJson(function () {
            $this->authorize('create', Media::class);

            $validated = request()->validate([
                'upload_id' => ['required', 'string', 'max:64'],
                'mediable_type' => ['required', 'string', 'in:global,rooms,room-groups'],
                'mediable_id' => ['sometimes', 'integer'],
                'original_name' => ['required', 'string', 'max:255'],
                'mime_type' => ['required', 'string', 'max:128'],
                'total_chunks' => ['required', 'integer', 'min:1'],
            ]);

            $chunkDir = 'uploads/chunks/'.$validated['upload_id'];
            $localDisk = Storage::disk('local');

            $mediable = match ($validated['mediable_type']) {
                'rooms' => Room::findOrFail($validated['mediable_id']),
                'room-groups' => RoomGroup::findOrFail($validated['mediable_id']),
                default => null,
            };

            if ($mediable !== null && ! $mediable instanceof Room && ! $mediable instanceof RoomGroup) {
                abort(422);
            }

            $extension = pathinfo($validated['original_name'], PATHINFO_EXTENSION);
            $originalFilename = pathinfo($validated['original_name'], PATHINFO_FILENAME);
            $name = Str::random(40).'.'.$extension;
            $finalPath = 'media/'.$name;

            Storage::disk('public')->makeDirectory(dirname($finalPath));

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
                if ($chunk === false) {
                    fclose($target);

                    return response()->json(['message' => "Chunk {$i} not found."], 422);
                }
                stream_copy_to_stream($chunk, $target);
                fclose($chunk);
            }

            fclose($target);

            $maxSort = $mediable instanceof Room || $mediable instanceof RoomGroup
                ? $mediable->media()->max('sort_order')
                : Media::global()->max('sort_order');
            $media = Media::create([
                'mediable_type' => $mediable ? $mediable::class : null,
                'mediable_id' => $mediable?->id,
                'path' => $finalPath,
                'type' => $this->determineFileType($extension),
                'name' => $originalFilename,
                'mime' => $validated['mime_type'],
                'sort_order' => ($maxSort ?? 0) + 1,
                'is_active' => true,
            ]);

            $this->cleanupChunks($validated['upload_id']);

            $this->broadcastMediaUpdated($media);

            return response()->json([
                'media' => $media->only(['id', 'type', 'name', 'path', 'size', 'mime', 'sort_order', 'is_active', 'file_url']),
            ]);
        }, 'Failed to assemble media.');
    }

    public function reorder(): RedirectResponse
    {
        return $this->catchErrors(function () {
            $order = request()->input('order', []);

            foreach ($order as $index => $mediaId) {
                Media::where('id', $mediaId)->update(['sort_order' => $index + 1]);
            }

            if (count($order) > 0) {
                $media = Media::with('mediable')->find($order[0]);

                if ($media instanceof Media) {
                    $this->broadcastMediaUpdated($media);
                }
            }

            return back();
        }, __('Failed to reorder media.'));
    }

    public function toggleActive(mixed $parent, Media $media): RedirectResponse
    {
        return $this->catchErrors(function () use ($media) {
            $media->update(['is_active' => ! $media->is_active]);

            $this->broadcastMediaUpdated($media);

            return back();
        }, __('Failed to update media status.'));
    }

    public function toggleActiveGlobal(Media $media): RedirectResponse
    {
        return $this->toggleActive(null, $media);
    }

    public function destroy(mixed $parent, Media $media): RedirectResponse
    {
        return $this->catchErrors(function () use ($media) {
            $this->authorize('delete', $media);
            $media->load('mediable');
            $media->deleteFile();
            $media->delete();
            $this->resequenceSortOrder($media);
            $this->broadcastMediaUpdated($media);

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Media deleted.']);

            return back();
        }, __('Failed to delete media.'));
    }

    public function destroyGlobal(Media $media): RedirectResponse
    {
        return $this->destroy(null, $media);
    }

    public function bulkDelete(Room $room): RedirectResponse
    {
        return $this->doBulkDelete($room);
    }

    public function bulkDeleteFromGrouping(RoomGroup $roomGroup): RedirectResponse
    {
        return $this->doBulkDelete($roomGroup);
    }

    public function bulkDeleteGlobal(): RedirectResponse
    {
        return $this->catchErrors(function () {
            $mediaIds = request()->input('media_ids', []);

            $mediaItems = Media::global()
                ->whereIn('id', $mediaIds)
                ->with('mediable')
                ->get();

            foreach ($mediaItems as $media) {
                $this->authorize('delete', $media);
                $media->deleteFile();
                $media->delete();
            }

            if ($mediaItems->isNotEmpty()) {
                $this->resequenceSortOrder($mediaItems->first());
                $this->broadcastMediaUpdated($mediaItems->first());
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => count($mediaItems).' media deleted.']);

            return back();
        }, __('Failed to delete media.'));
    }

    private function doBulkDelete(Room|RoomGroup $mediable): RedirectResponse
    {
        return $this->catchErrors(function () use ($mediable) {
            $mediaIds = request()->input('media_ids', []);

            $mediaItems = Media::whereIn('id', $mediaIds)
                ->where('mediable_type', $mediable::class)
                ->where('mediable_id', $mediable->id)
                ->with('mediable')
                ->get();

            foreach ($mediaItems as $media) {
                $this->authorize('delete', $media);
                $media->deleteFile();
                $media->delete();
            }

            if ($mediaItems->isNotEmpty()) {
                $this->resequenceSortOrder($mediaItems->first());
                $this->broadcastMediaUpdated($mediaItems->first());
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => count($mediaItems).' media deleted.']);

            return back();
        }, __('Failed to delete media.'));
    }

    private function resequenceSortOrder(Media $media): void
    {
        $mediable = $media->mediable;

        $query = Media::query();

        if ($mediable instanceof Room || $mediable instanceof RoomGroup) {
            $query->where('mediable_type', $mediable::class)->where('mediable_id', $mediable->id);
        } else {
            $query->global();
        }

        $items = $query->orderBy('sort_order')->orderBy('id')->get();
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

    private function broadcastMediaUpdated(Media $media): void
    {
        if (! $media->relationLoaded('mediable')) {
            $media->load('mediable');
        }

        $mediable = $media->mediable;

        if ($mediable instanceof Room) {
            PublicBroadcast::dispatch('Display.Room.'.$mediable->id, 'MediaUpdated', $mediable->toArray());
        } elseif ($mediable instanceof RoomGroup) {
            PublicBroadcast::dispatch('Display.RoomGroup.'.$mediable->id, 'MediaUpdated', $mediable->toArray());
        } else {
            PublicBroadcast::dispatch('Display.Global', 'MediaUpdated', []);
        }
    }
}
