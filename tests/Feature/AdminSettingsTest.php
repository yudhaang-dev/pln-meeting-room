<?php

use App\Models\User;
use App\Settings\GeneralSettings;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->user = User::factory()->create(['role' => 'user']);
});

test('admin can view general settings page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('admin.settings.edit'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/settings'));
});

test('operator can view general settings page', function () {
    $this->actingAs($this->operator);

    $response = $this->get(route('admin.settings.edit'));
    $response->assertOk();
});

test('regular user cannot view general settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('admin.settings.edit'));
    $response->assertForbidden();
});

test('admin can update general settings', function () {
    $this->actingAs($this->admin);

    $response = $this->put(route('admin.settings.update'), [
        'booking_advance_hours' => 48,
        'booking_max_days_ahead' => 60,
        'cancellation_hours' => 4,
        'auto_approve_bookings' => true,
        'default_osh_level_id' => null,
        'display_refresh_interval' => 60,
        'media_loop_duration' => 15,
    ]);

    $response->assertRedirect();

    $settings = app(GeneralSettings::class);
    $this->assertEquals(48, $settings->booking_advance_hours);
    $this->assertEquals(60, $settings->booking_max_days_ahead);
    $this->assertEquals(4, $settings->cancellation_hours);
    $this->assertTrue($settings->auto_approve_bookings);
    $this->assertEquals(60, $settings->display_refresh_interval);
    $this->assertEquals(15, $settings->media_loop_duration);
});

test('general settings validation requires valid values', function () {
    $this->actingAs($this->admin);

    $response = $this->put(route('admin.settings.update'), [
        'booking_advance_hours' => -1,
        'booking_max_days_ahead' => 'not-a-number',
        'cancellation_hours' => 999,
        'auto_approve_bookings' => 'not-a-boolean',
        'display_refresh_interval' => 1,
        'media_loop_duration' => 1,
    ]);

    $response->assertSessionHasErrors([
        'booking_advance_hours',
        'booking_max_days_ahead',
        'cancellation_hours',
        'auto_approve_bookings',
        'display_refresh_interval',
        'media_loop_duration',
    ]);
});
