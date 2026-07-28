<?php

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
        ->has('totalBuildings')
        ->has('totalRooms')
        ->has('pendingBookingsCount')
        ->has('totalUsers')
        ->has('pendingBookings')
        ->has('recentBookings')
    );
});

test('regular user can access user dashboard', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard/index')
        ->has('upcomingBookingsCount')
        ->has('nextBookings')
        ->has('totalRooms')
    );
});
