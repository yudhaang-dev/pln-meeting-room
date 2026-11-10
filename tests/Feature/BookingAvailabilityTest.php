<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;

test('availability lists pending and approved slots per room but not rejected ones', function () {
    $room = Room::factory()->create(['is_active' => true]);
    $day = now()->addDays(3)->startOfDay();

    $make = fn (string $status, int $hour, $endedAt = null) => Booking::factory()->create([
        'room_id' => $room->id, 'status' => $status, 'ended_at' => $endedAt,
        'start_time' => $day->copy()->setTime($hour, 0), 'end_time' => $day->copy()->setTime($hour + 1, 0),
    ]);

    $approved = $make('approved', 8);
    $pending = $make('pending', 10);
    $make('rejected', 12);

    $this->actingAs(User::factory()->create(['role' => 'user']))
        ->getJson(route('bookings.availability', ['date' => $day->format('Y-m-d')]))
        ->assertOk()
        ->assertJsonPath('rooms.0.id', $room->id)
        ->assertJsonCount(2, 'rooms.0.slots')
        ->assertJsonPath('rooms.0.slots.0.status', 'approved')
        ->assertJsonPath('rooms.0.slots.1.status', 'pending');

    $this->getJson(route('bookings.availability', ['date' => $day->format('Y-m-d'), 'exclude' => $pending->id]))
        ->assertJsonCount(1, 'rooms.0.slots');

    $this->getJson(route('bookings.availability', ['date' => 'salah']))->assertStatus(422);
});

test('availability requires login', function () {
    $this->getJson(route('bookings.availability', ['date' => '2026-12-01']))->assertUnauthorized();
});

test('availability for a room returns its slots over a range together with booking rules', function () {
    $room = Room::factory()->create(['is_active' => true]);
    $other = Room::factory()->create(['is_active' => true]);
    $day = now()->addDays(5)->startOfDay();

    $mine = Booking::factory()->create([
        'room_id' => $room->id, 'status' => 'approved', 'ended_at' => null,
        'start_time' => $day->copy()->setTime(9, 0), 'end_time' => $day->copy()->setTime(10, 0),
    ]);
    Booking::factory()->create([
        'room_id' => $other->id, 'status' => 'approved', 'ended_at' => null,
        'start_time' => $day->copy()->setTime(9, 0), 'end_time' => $day->copy()->setTime(10, 0),
    ]);

    $query = ['room_id' => $room->id, 'from' => now()->format('Y-m-d'), 'to' => now()->addDays(30)->format('Y-m-d')];

    $this->actingAs(User::factory()->create(['role' => 'user']))
        ->getJson(route('bookings.availability', $query))
        ->assertOk()
        ->assertJsonCount(1, 'slots')
        ->assertJsonStructure(['rules' => ['now', 'advance_hours', 'max_days_ahead']]);

    $this->getJson(route('bookings.availability', $query + ['exclude' => $mine->id]))
        ->assertJsonCount(0, 'slots');

    $this->getJson(route('bookings.availability', ['room_id' => $room->id, 'from' => '2026-01-01', 'to' => '2028-12-31']))
        ->assertStatus(422);
});
