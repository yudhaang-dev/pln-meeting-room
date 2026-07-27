<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->user = User::factory()->create(['role' => 'user']);
});

test('admin can view users page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('admin.users.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/users/index'));
});

test('operator cannot view users page', function () {
    $this->actingAs($this->operator);

    $response = $this->get(route('admin.users.index'));
    $response->assertForbidden();
});

test('regular user cannot view users page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('admin.users.index'));
    $response->assertForbidden();
});

test('admin can create user', function () {
    $this->actingAs($this->admin);

    $response = $this->post(route('admin.users.store'), [
        'name' => 'New User',
        'email' => 'new@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'operator',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'name' => 'New User',
        'email' => 'new@example.com',
        'role' => 'operator',
    ]);
});

test('admin can update user', function () {
    $this->actingAs($this->admin);

    $response = $this->put(route('admin.users.update', $this->user), [
        'name' => 'Updated Name',
        'email' => $this->user->email,
        'role' => 'operator',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $this->user->id,
        'name' => 'Updated Name',
        'role' => 'operator',
    ]);
});

test('admin can update user password', function () {
    $this->actingAs($this->admin);

    $response = $this->put(route('admin.users.update', $this->user), [
        'name' => $this->user->name,
        'email' => $this->user->email,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
        'role' => $this->user->role,
    ]);

    $response->assertRedirect();
    $this->assertTrue(Hash::check('newpassword123', $this->user->fresh()->password));
});

test('admin can delete user', function () {
    $this->actingAs($this->admin);

    $response = $this->delete(route('admin.users.destroy', $this->user));

    $response->assertRedirect();
    $this->assertDatabaseMissing('users', ['id' => $this->user->id]);
});

test('admin cannot delete own account', function () {
    $this->actingAs($this->admin);

    $response = $this->delete(route('admin.users.destroy', $this->admin));

    $response->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
});

test('user search filters results', function () {
    $this->actingAs($this->admin);
    User::factory()->create(['name' => 'Alpha User']);
    User::factory()->create(['name' => 'Beta User']);

    $response = $this->get(route('admin.users.index', ['search' => 'Alpha']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('users.data', 1));
});

test('user validation requires name', function () {
    $this->actingAs($this->admin);

    $response = $this->postJson(route('admin.users.store'), [
        'name' => '',
        'email' => 'test@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'user',
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['name']);
});

test('user validation requires unique email', function () {
    $this->actingAs($this->admin);

    $response = $this->postJson(route('admin.users.store'), [
        'name' => 'Duplicate',
        'email' => $this->user->email,
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'user',
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['email']);
});

test('user validation requires valid role', function () {
    $this->actingAs($this->admin);

    $response = $this->postJson(route('admin.users.store'), [
        'name' => 'Test',
        'email' => 'test@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'invalid',
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['role']);
});

test('user validation requires password on create', function () {
    $this->actingAs($this->admin);

    $response = $this->postJson(route('admin.users.store'), [
        'name' => 'Test',
        'email' => 'test@example.com',
        'role' => 'user',
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['password']);
});
