<?php

use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->user = User::factory()->create(['role' => 'user']);
});

test('admin can view the users list', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('users.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('users/index'));
});

test('admin can create a user with a role', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('users.store'), [
        'name' => 'New Operator',
        'email' => 'operator@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'operator',
    ]);

    $response->assertRedirect(route('users.index'));

    $this->assertDatabaseHas('users', [
        'email' => 'operator@example.com',
        'role' => 'operator',
    ]);
});

test('user creation validates duplicate email, weak password and role', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('users.store'), [
        'name' => 'Invalid',
        'email' => $this->admin->email,
        'password' => 'short',
        'password_confirmation' => 'short',
        'role' => 'superadmin',
    ]);

    $response->assertSessionHasErrors(['email', 'password', 'role']);
});

test('admin can update a user name, email and role', function () {
    $this->actingAs($this->admin);

    $target = User::factory()->create(['role' => 'user']);

    $response = $this->put(route('users.update', $target), [
        'name' => 'Renamed User',
        'email' => 'renamed@example.com',
        'role' => 'admin',
    ]);

    $response->assertRedirect();

    $target->refresh();
    $this->assertEquals('Renamed User', $target->name);
    $this->assertEquals('admin', $target->role);
});

test('admin can delete another user', function () {
    $this->actingAs($this->admin);

    $target = User::factory()->create();

    $response = $this->delete(route('users.destroy', $target));

    $response->assertRedirect();
    $this->assertDatabaseMissing('users', ['id' => $target->id]);
});

test('admin cannot delete their own account', function () {
    $this->actingAs($this->admin);

    $response = $this->delete(route('users.destroy', $this->admin));

    $response->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
});

test('operator cannot access users management', function () {
    $this->actingAs($this->operator);

    $this->get(route('users.index'))->assertForbidden();
    $this->post(route('users.store'), [
        'name' => 'Nope',
        'email' => 'nope@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'user',
    ])->assertForbidden();
});

test('regular user cannot access users management', function () {
    $this->actingAs($this->user);

    $this->get(route('users.index'))->assertForbidden();
    $this->delete(route('users.destroy', $this->admin))->assertForbidden();
});
