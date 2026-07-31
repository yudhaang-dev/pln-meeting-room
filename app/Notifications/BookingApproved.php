<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class BookingApproved extends Notification
{
    use Queueable;

    private array $data;

    public function __construct(Booking $booking)
    {
        $this->data = [
            'type' => 'booking_approved',
            'booking_id' => $booking->id,
            'message' => 'Your booking "'.$booking->title.'" has been approved.',
            'booking' => [
                'id' => $booking->id,
                'title' => $booking->title,
                'room' => $booking->room->name,
                'start_time' => $booking->start_time->toISOString(),
                'end_time' => $booking->end_time->toISOString(),
            ],
        ];
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->data);
    }

    public function toArray(object $notifiable): array
    {
        return $this->data;
    }
}
