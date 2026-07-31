<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Booking $booking) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return $this->buildChannelNames();
    }

    public function broadcastWith(): array
    {
        return $this->booking->toArray();
    }

    private function buildChannelNames()
    {
        $channels = [];

        $isApproved = $this->booking->status == 'approved';
        $isToday = $this->booking->start_time->isToday();

        if ($isApproved) {
            array_push($channels, new Channel('Display.Osh'));
        }

        if ($isApproved && $isToday) {
            array_push($channels, new Channel('Display.Room.'.$this->booking->room->id));
            foreach ($this->booking->room->roomGroups as $group) {
                array_push($channels, new Channel('Display.RoomGroup.'.$group->id));
            }
        }

        return $channels;
    }
}
