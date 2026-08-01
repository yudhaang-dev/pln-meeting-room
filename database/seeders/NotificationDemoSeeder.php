<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Notifications\BookingStatusNotification;
use Illuminate\Database\Seeder;

class NotificationDemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.com')->first();
        $user = User::where('email', 'user@example.com')->first();
        $room = Room::first();

        if (! $admin || ! $user || ! $room) {
            $this->command->error('Missing admin, user, or room.');

            return;
        }

        $booking1 = Booking::factory()->create(['requested_id' => $user->id, 'room_id' => $room->id, 'title' => 'Team Standup']);
        $booking2 = Booking::factory()->create(['requested_id' => $user->id, 'room_id' => $room->id, 'title' => 'Sprint Planning']);
        $booking3 = Booking::factory()->create(['requested_id' => $user->id, 'room_id' => $room->id, 'title' => 'Design Review']);

        // Admin gets 3 booking_created notifications
        foreach ([$booking1, $booking2, $booking3] as $booking) {
            $admin->notify(new BookingStatusNotification(
                'Booking',
                "New Booking '{$booking->title}' by {$user->name}",
                $this->payload($booking)
            ));
        }

        // User gets 1 approved + 1 rejected
        $user->notify(new BookingStatusNotification(
            'Booking',
            "Your booking '{$booking1->title}' has been Approved",
            $this->payload($booking1)
        ));
        $user->notify(new BookingStatusNotification(
            'Booking',
            "Your booking '{$booking2->title}' has been Rejected",
            $this->payload($booking2)
        ));

        $this->command->info("Seeded: admin={$admin->unreadNotifications()->count()}, user={$user->unreadNotifications()->count()}");
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
