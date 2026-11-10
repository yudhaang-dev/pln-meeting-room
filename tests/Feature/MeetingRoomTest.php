<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;

test('meeting rooms page lists only upcoming approved bookings', function () {
    $room = Room::factory()->create(['is_active' => true]);
    $upcoming = Booking::factory()->create([
        'room_id' => $room->id, 'status' => 'approved',
        'start_time' => now()->addDay(), 'end_time' => now()->addDay()->addHour(), 'ended_at' => null,
    ]);
    Booking::factory()->create([
        'room_id' => $room->id, 'status' => 'pending',
        'start_time' => now()->addDays(2), 'end_time' => now()->addDays(2)->addHour(), 'ended_at' => null,
    ]);
    Booking::factory()->create([
        'room_id' => $room->id, 'status' => 'approved',
        'start_time' => now()->subDays(2), 'end_time' => now()->subDays(2)->addHour(), 'ended_at' => null,
    ]);

    $this->actingAs(User::factory()->create(['role' => 'user']))
        ->get(route('meeting-rooms.index'))
        ->assertInertia(function ($page) use ($room, $upcoming) {
            $rooms = collect($page->toArray()['props']['rooms'])->keyBy('id');
            expect($rooms[$room->id]['upcoming_total'])->toBe(1)
                ->and($rooms[$room->id]['upcoming'][0]['id'])->toBe($upcoming->id);
        });

    $this->get(route('meeting-rooms.show', $room))
        ->assertInertia(fn ($page) => $page->component('meeting-rooms/show')->has('bookings', 1));
});
