<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Notifications\BookingApproved;
use App\Notifications\BookingCreated;
use App\Notifications\BookingRejected;
use Illuminate\Database\Seeder;

class NotificationDemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.com')->first();
        $user = User::where('email', 'user@example.com')->first();
        $room = Room::first();

        if (! $admin || ! $user || ! $room) {
            $this->command?->error('Missing admin, user, or room.');

            return;
        }

        $booking1 = Booking::factory()->create(['requested_id' => $user->id, 'room_id' => $room->id, 'title' => 'Team Standup']);
        $booking2 = Booking::factory()->create(['requested_id' => $user->id, 'room_id' => $room->id, 'title' => 'Sprint Planning']);
        $booking3 = Booking::factory()->create(['requested_id' => $user->id, 'room_id' => $room->id, 'title' => 'Design Review']);

        // Admin gets 3 booking_created notifications
        $admin->notify(new BookingCreated($booking1));
        $admin->notify(new BookingCreated($booking2));
        $admin->notify(new BookingCreated($booking3));

        // User gets 1 approved + 1 rejected
        $user->notify(new BookingApproved($booking1));
        $user->notify(new BookingRejected($booking2));

        $this->command?->info("Seeded: admin={$admin->unreadNotifications()->count()}, user={$user->unreadNotifications()->count()}");
    }
}
