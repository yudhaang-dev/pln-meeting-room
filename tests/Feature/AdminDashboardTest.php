<?php

use App\Models\User;

test('admin can access admin dashboard page', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user);

    $response = $this->get(route('admin.dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/dashboard'));
});

test('operator can access admin dashboard page', function () {
    $user = User::factory()->create(['role' => 'operator']);
    $this->actingAs($user);

    $response = $this->get(route('admin.dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/dashboard'));
});

test('regular user cannot access admin dashboard page', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->get(route('admin.dashboard'));
    $response->assertForbidden();
});

test('admin dashboard returns correct stats', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user);

    $response = $this->get(route('admin.dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/dashboard')
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
        ->component('dashboard')
        ->has('upcomingBookingsCount')
        ->has('nextBookings')
        ->has('totalRooms')
    );
});
