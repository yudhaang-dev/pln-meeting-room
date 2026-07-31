<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Events\BookingUpdated;
use App\Models\User;
use App\Notifications\BookingStatusNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

class SendBookingNotification implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(BookingCreated|BookingUpdated $event): void
    {
        $booking = $event->booking;

        // Skenario 1: Booking Baru Dibuat
        if ($event instanceof BookingCreated) {
            $recipients = User::whereIn('role', ['admin', 'operator'])
                ->where('id', '!=', $booking->requestedBy->id)
                ->get();

            Notification::send($recipients, new BookingStatusNotification(
                'Booking',
                "New Booking '{$booking->title}' by {$booking->requestedBy->name}",
                $booking->toArray()
            ));
        }

        // Skenario 2: Booking Diupdate (Approved / Rejected)
        if ($event instanceof BookingUpdated) {

            $status = ucfirst($booking->status);

            // 1. Kirim ke pembuat booking (requestedBy)
            if ($booking->requestedBy->id != $booking->approvedBy->id) {
                $booking->requestedBy->notify(new BookingStatusNotification(
                    'Booking',
                    "Your booking '{$booking->title}' has been {$status} by {$booking->approvedBy->name}",
                    $booking->toArray()
                ));
            }

            // 2. Kirim ke seluruh Admin dan Operator lainnya
            $staff = User::whereIn('role', ['admin', 'operator'])
                ->where('id', '!=', $booking->approvedBy->id) // kecuali yang menyetujui
                ->get();

            Notification::send($staff, new BookingStatusNotification(
                'Booking',
                "Booking '{$booking->title}' {$status} by {$booking->approvedBy->name}",
                $booking->toArray()
            ));
        }
    }
}
