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

    public function __construct(
        public Booking $booking,
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new Channel('room.'.$this->booking->room_id),
            new Channel('bookings'),
        ];

        foreach ($this->booking->room->roomGroups as $grouping) {
            $channels[] = new Channel('room-group.'.$grouping->id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'booking.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->booking->id,
            'title' => $this->booking->title,
            'start_time' => $this->booking->start_time->toISOString(),
            'end_time' => $this->booking->end_time->toISOString(),
            'status' => $this->booking->status,
            'participants_count' => $this->booking->participants_count,
            'room_id' => $this->booking->room_id,
            'event_leader' => $this->booking->chairperson?->only('id', 'name'),
            'osh_level' => $this->booking->osh_level?->only('id', 'name', 'color'),
        ];
    }
}
