<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingStatusNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     *
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        protected string $resource,
        protected string $message,
        protected array $payload
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => $this->message,
            'resource' => $this->resource,
            'payload' => $this->payload,
        ];
    }
}
