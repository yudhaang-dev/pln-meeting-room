<?php

use App\Models\User;

test('admin can access dashboard', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('operator can access dashboard', function () {
    $user = User::factory()->create(['role' => 'operator']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('regular user can access dashboard', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});
