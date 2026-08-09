<?php

use App\Models\Booking;
use App\Models\User;

test('admin can access dashboard', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('dashboard/admin'));
});

test('operator can access dashboard', function () {
    $user = User::factory()->create(['role' => 'operator']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('dashboard/admin'));
});

test('admin dashboard returns correct stats', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard/admin')
        ->has('statistics.eventsMonthly', 12)
        ->has('statistics.participantsMonthly', 12)
        ->has('statistics.eventsByStatus')
        ->has('statistics.participantsByRoom')
        ->has('statistics.usersMonthly', 12)
        ->has('statistics.usersShare')
        ->has('statistics.roomsMonthly', 12)
        ->has('statistics.roomsShare')
    );
});

test('regular user can access user dashboard', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard/index')
        ->has('totalBookings')
        ->has('pendingBookingsCount')
        ->has('approvedBookingsCount')
        ->has('rejectedBookingsCount')
        ->has('approvedSchedule.data')
    );
});

test('user dashboard returns booking counts for the current user', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    Booking::factory()->count(2)->create(['requested_id' => $user->id, 'status' => 'pending']);
    Booking::factory()->count(3)->create(['requested_id' => $user->id, 'status' => 'approved']);
    Booking::factory()->count(1)->create(['requested_id' => $user->id, 'status' => 'rejected']);
    Booking::factory()->count(5)->create(['status' => 'approved']);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard/index')
        ->where('totalBookings', 6)
        ->where('pendingBookingsCount', 2)
        ->where('approvedBookingsCount', 3)
        ->where('rejectedBookingsCount', 1)
    );
});

test('user dashboard shows only approved schedule from today onward', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $upcoming = Booking::factory()->approved()->create([
        'start_time' => now()->addDays(2)->startOfDay(),
    ]);
    Booking::factory()->approved()->create([
        'start_time' => now()->subDays(2)->startOfDay(),
    ]);
    Booking::factory()->create([
        'status' => 'pending',
        'start_time' => now()->addDays(3)->startOfDay(),
    ]);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard/index')
        ->has('approvedSchedule.data', 1)
        ->where('approvedSchedule.data.0.id', $upcoming->id)
    );
});
