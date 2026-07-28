<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class BookingCreated extends Notification
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
            'type' => 'booking_created',
            'booking_id' => $this->booking->id,
            'message' => 'New booking "'.$this->booking->title.'" submitted by '.$this->booking->requestedBy->name.' for room '.$this->booking->room->name,
            'booking' => [
                'id' => $this->booking->id,
                'title' => $this->booking->title,
                'room' => $this->booking->room->name,
                'requested_by' => $this->booking->requestedBy->name,
                'start_time' => $this->booking->start_time->toISOString(),
                'end_time' => $this->booking->end_time->toISOString(),
                'participants_count' => $this->booking->participants_count,
            ],
        ];
    }
}
