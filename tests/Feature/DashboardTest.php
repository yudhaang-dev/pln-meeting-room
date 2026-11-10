<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard marks a room as in use only while an approved meeting is ongoing', function () {
    $user = \App\Models\User::factory()->create(['role' => 'user']);
    $busy = \App\Models\Room::factory()->create(['is_active' => true]);
    $free = \App\Models\Room::factory()->create(['is_active' => true]);
    $finished = \App\Models\Room::factory()->create(['is_active' => true]);

    \App\Models\Booking::factory()->create([
        'room_id' => $busy->id, 'status' => 'approved',
        'start_time' => now()->subHour(), 'end_time' => now()->addHour(), 'ended_at' => null,
    ]);
    \App\Models\Booking::factory()->create([
        'room_id' => $finished->id, 'status' => 'approved',
        'start_time' => now()->subHour(), 'end_time' => now()->addHour(), 'ended_at' => now()->subMinute(),
    ]);

    $this->actingAs($user)->get(route('dashboard'))->assertInertia(function ($page) use ($busy, $free, $finished) {
        $rooms = collect($page->toArray()['props']['roomStatuses'])->keyBy('id');

        expect($rooms[$busy->id]['booking'])->not->toBeNull()
            ->and($rooms[$free->id]['booking'])->toBeNull()
            ->and($rooms[$finished->id]['booking'])->toBeNull();
    });
});
