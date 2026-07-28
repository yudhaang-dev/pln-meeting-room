<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class BookingApproved extends Notification
{
    use Queueable;

    public function __construct(
        public Booking $booking,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'booking_approved',
            'booking_id' => $this->booking->id,
            'message' => 'Your booking "'.$this->booking->title.'" has been approved.',
            'booking' => [
                'id' => $this->booking->id,
                'title' => $this->booking->title,
                'room' => $this->booking->room->name,
                'start_time' => $this->booking->start_time->toISOString(),
                'end_time' => $this->booking->end_time->toISOString(),
            ],
        ];
    }
}
