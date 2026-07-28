<?php

namespace App\Events;

use App\Models\Media;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MediaUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Media $media,
    ) {}

    public function broadcastOn(): array
    {
        $channels = [];
        $mediable = $this->media->mediable;

        if ($mediable) {
            $channels[] = new Channel(strtolower(class_basename($mediable)).'.'.$mediable->id);

            if (method_exists($mediable, 'roomGroups')) {
                foreach ($mediable->roomGroups as $group) {
                    $channels[] = new Channel('room-group.'.$group->id);
                }
            }
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'media.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->media->id,
            'type' => $this->media->type,
            'name' => $this->media->name,
            'file_url' => $this->media->file_url,
            'sort_order' => $this->media->sort_order,
            'is_active' => $this->media->is_active,
        ];
    }
}
