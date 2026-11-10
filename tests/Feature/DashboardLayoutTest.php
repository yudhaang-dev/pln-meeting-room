<?php

use App\Models\ActivityLog;
use App\Models\User;

test('dashboard layout defaults to all widgets in the standard order', function () {
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('layout.order', ['rooms', 'events', 'participants', 'users', 'room_usage'])
            ->where('layout.hidden', [])
            ->where('layout.customized', false));
});

test('each account keeps its own dashboard layout', function () {
    $operator = User::factory()->create(['role' => 'operator']);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($operator)->put(route('dashboard.layout.update'), [
        'order' => ['events', 'rooms', 'users', 'participants', 'room_usage'],
        'hidden' => ['participants'],
    ])->assertRedirect();

    // Request berikutnya memuat user dari database, seperti di aplikasi sungguhan.
    $this->actingAs($operator->fresh())->get(route('dashboard'))->assertInertia(fn ($page) => $page
        ->where('layout.order', ['events', 'rooms', 'users', 'participants', 'room_usage'])
        ->where('layout.hidden', ['participants'])
        ->where('layout.customized', true));

    // Akun lain tidak terpengaruh.
    $this->actingAs($admin)->get(route('dashboard'))->assertInertia(fn ($page) => $page
        ->where('layout.order', ['rooms', 'events', 'participants', 'users', 'room_usage'])
        ->where('layout.customized', false));
});

test('widgets missing from a saved layout are appended and unknown ones are ignored', function () {
    $operator = User::factory()->create(['role' => 'operator']);

    $operator->forceFill(['dashboard_layout' => ['order' => ['users', 'sudah-dihapus'], 'hidden' => ['rooms', 'x']]])->save();

    $this->actingAs($operator)->get(route('dashboard'))->assertInertia(fn ($page) => $page
        ->where('layout.order', ['users', 'rooms', 'events', 'participants', 'room_usage'])
        ->where('layout.hidden', ['rooms']));
});

test('invalid layouts are rejected', function () {
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->put(route('dashboard.layout.update'), ['order' => ['bukan-blok'], 'hidden' => []])
        ->assertSessionHasErrors('order.0');
});

test('layout can be reset to default', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->put(route('dashboard.layout.update'), ['order' => ['users'], 'hidden' => ['rooms']]);
    $this->delete(route('dashboard.layout.destroy'))->assertRedirect();

    expect($admin->fresh()->dashboard_layout)->toBeNull();
});

test('regular users cannot change the admin dashboard layout', function () {
    $this->actingAs(User::factory()->create(['role' => 'user']))
        ->put(route('dashboard.layout.update'), ['order' => ['rooms'], 'hidden' => []])
        ->assertForbidden();
});

test('saving a layout is not recorded as a user change in the activity log', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->put(route('dashboard.layout.update'), ['order' => ['users'], 'hidden' => []]);

    expect(ActivityLog::where('event', 'like', 'user.%')->count())->toBe(0);
});
