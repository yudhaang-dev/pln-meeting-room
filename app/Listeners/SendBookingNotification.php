<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Events\BookingUpdated;
use App\Models\Booking;
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
            $requestedBy = $booking->requestedBy;

            $recipients = User::whereIn('role', ['admin', 'operator'])
                ->where('id', '!=', $requestedBy?->id)
                ->get();

            Notification::send($recipients, new BookingStatusNotification(
                'Booking',
                "Pengajuan booking baru '{$booking->title}' dari {$requestedBy?->name}",
                $this->payload($booking)
            ));
        }

        // Skenario 2: Booking Diupdate (Approved / Rejected)
        if ($event instanceof BookingUpdated) {

            $status = match ($booking->status) {
                'approved' => 'disetujui',
                'rejected' => 'ditolak',
                'cancelled' => 'dibatalkan',
                default => $booking->status,
            };
            $requestedBy = $booking->requestedBy;
            $approvedBy = $booking->approvedBy;

            // 1. Kirim ke pembuat booking (requestedBy)
            if ($requestedBy && $approvedBy && $requestedBy->id !== $approvedBy->id) {
                $requestedBy->notify(new BookingStatusNotification(
                    'Booking',
                    "Booking Anda '{$booking->title}' telah {$status} oleh {$approvedBy->name}",
                    $this->payload($booking)
                ));
            }

            // 2. Kirim ke seluruh Admin dan Operator lainnya
            $staff = User::whereIn('role', ['admin', 'operator'])
                ->where('id', '!=', $approvedBy?->id) // kecuali yang menyetujui
                ->get();

            Notification::send($staff, new BookingStatusNotification(
                'Booking',
                "Booking '{$booking->title}' {$status} oleh {$approvedBy?->name}",
                $this->payload($booking)
            ));
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Booking $booking): array
    {
        return array_merge($booking->toArray(), [
            'room' => $booking->room?->name,
        ]);
    }
}
