<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class BookingUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    private array $channelNames;

    private array $payload;

    public function __construct(Booking $booking)
    {
        $channelNames = [
            'room.'.$booking->room_id,
            'bookings',
        ];

        foreach ($booking->room->roomGroups as $grouping) {
            $channelNames[] = 'room-group.'.$grouping->id;
        }

        $this->channelNames = $channelNames;

        $this->payload = [
            'id' => $booking->id,
            'title' => $booking->title,
            'start_time' => $booking->start_time->toISOString(),
            'end_time' => $booking->end_time->toISOString(),
            'status' => $booking->status,
            'participants_count' => $booking->participants_count,
            'room_id' => $booking->room_id,
            'event_leader' => $booking->chairperson?->only('id', 'name'),
            'osh_level' => $booking->osh_level?->only('id', 'name', 'color'),
        ];
    }

    public function broadcastOn(): array
    {
        return array_map(fn (string $name) => new Channel($name), $this->channelNames);
    }

    public function broadcastAs(): string
    {
        return 'booking.updated';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
