<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Booking $booking, public bool $notify = true) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return $this->buildChannelNames();
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->booking->toArray();
    }

    /**
     * @return array<int, Channel>
     */
    private function buildChannelNames(): array
    {
        $channels = [];

        $isApproved = $this->booking->status == 'approved';
        $isToday = $this->booking->start_time->isToday();

        if ($isApproved) {
            array_push($channels, new Channel('Display.Osh'));
        }

        $room = $this->booking->room;

        if ($isApproved && $isToday && $room) {
            array_push($channels, new Channel('Display.Room.'.$room->id));
            foreach ($room->roomGroups as $group) {
                array_push($channels, new Channel('Display.RoomGroup.'.$group->id));
            }
        }

        return $channels;
    }
}
