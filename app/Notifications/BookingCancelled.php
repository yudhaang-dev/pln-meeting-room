<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingCancelled extends Notification
{
    use Queueable;

    private array $data;

    public function __construct(Booking $booking)
    {
        $this->data = [
            'type' => 'booking_cancelled',
            'booking_id' => $booking->id,
            'message' => 'Booking "'.$booking->title.'" has been cancelled.',
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
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return $this->data;
    }
}
