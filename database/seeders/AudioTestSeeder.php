<?php

namespace Database\Seeders;

use App\Events\BookingUpdated;
use App\Models\Booking;
use Illuminate\Database\Seeder;

class AudioTestSeeder extends Seeder
{
    public function run(): void
    {
        $booking = Booking::with('room')->latest()->first();

        if (! $booking) {
            $this->command?->error('No bookings found.');

            return;
        }

        broadcast(new BookingUpdated($booking));

        $this->command?->info("Broadcast BookingUpdated for booking #{$booking->id} ({$booking->title})");
    }
}
