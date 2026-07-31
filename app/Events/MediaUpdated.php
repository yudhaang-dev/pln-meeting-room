<?php

namespace App\Events;

use App\Models\Media;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class MediaUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    private array $channelNames;

    private array $payload;

    public function __construct(Media $media)
    {
        $channelNames = [];
        $mediable = $media->mediable;

        if ($mediable) {
            $channelNames[] = strtolower(class_basename($mediable)).'.'.$mediable->id;

            if (method_exists($mediable, 'roomGroups')) {
                foreach ($mediable->roomGroups as $group) {
                    $channelNames[] = 'room-group.'.$group->id;
                }
            }
        }

        $this->channelNames = $channelNames;

        $this->payload = [
            'id' => $media->id,
            'type' => $media->type,
            'name' => $media->name,
            'file_url' => $media->file_url,
            'sort_order' => $media->sort_order,
            'is_active' => $media->is_active,
        ];
    }

    public function broadcastOn(): array
    {
        return array_map(fn (string $name) => new Channel($name), $this->channelNames);
    }

    public function broadcastAs(): string
    {
        return 'media.updated';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
