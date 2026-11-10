<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;

test('schedule shows approved meetings for the next 7 days with own flag', function () {
    $me = User::factory()->create(['role' => 'user']);
    $other = User::factory()->create(['role' => 'user']);
    $room = Room::factory()->create();

    $mine = Booking::factory()->create([
        'requested_id' => $me->id, 'room_id' => $room->id, 'status' => 'approved', 'ended_at' => null,
        'start_time' => now()->addDay()->setTime(10, 0), 'end_time' => now()->addDay()->setTime(11, 0),
    ]);
    $theirs = Booking::factory()->create([
        'requested_id' => $other->id, 'room_id' => $room->id, 'status' => 'approved', 'ended_at' => null,
        'start_time' => now()->addDays(2)->setTime(10, 0), 'end_time' => now()->addDays(2)->setTime(11, 0),
    ]);
    Booking::factory()->create([
        'room_id' => $room->id, 'status' => 'pending', 'ended_at' => null,
        'start_time' => now()->addDay()->setTime(13, 0), 'end_time' => now()->addDay()->setTime(14, 0),
    ]);
    Booking::factory()->create([
        'room_id' => $room->id, 'status' => 'approved', 'ended_at' => null,
        'start_time' => now()->addDays(9)->setTime(10, 0), 'end_time' => now()->addDays(9)->setTime(11, 0),
    ]);

    $this->actingAs($me)->get(route('schedule.index'))->assertInertia(function ($page) use ($mine, $theirs) {
        $days = $page->toArray()['props']['days'];
        $all = collect($days)->pluck('bookings')->flatten(1)->keyBy('id');

        expect($days)->toHaveCount(7)
            ->and($all)->toHaveCount(2)
            ->and($all[$mine->id]['is_mine'])->toBeTrue()
            ->and($all[$theirs->id]['is_mine'])->toBeFalse();
    });
});

test('schedule can be paged to another week with the start parameter', function () {
    $room = Room::factory()->create();
    $next = Booking::factory()->create([
        'room_id' => $room->id, 'status' => 'approved', 'ended_at' => null,
        'start_time' => now()->addDays(9)->setTime(10, 0), 'end_time' => now()->addDays(9)->setTime(11, 0),
    ]);

    $this->actingAs(User::factory()->create(['role' => 'user']))
        ->get(route('schedule.index', ['start' => now()->addDays(7)->format('Y-m-d')]))
        ->assertInertia(function ($page) use ($next) {
            $props = $page->toArray()['props'];
            $ids = collect($props['days'])->pluck('bookings')->flatten(1)->pluck('id');

            expect($ids->all())->toBe([$next->id])
                ->and($props['range']['start'])->toBe(now()->addDays(7)->format('Y-m-d'))
                ->and($props['range']['prev'])->toBe(now()->format('Y-m-d'));
        });

    $this->get(route('schedule.index', ['start' => 'bukan-tanggal']))->assertSessionHasErrors('start');
});
