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

    $response = $this->get(route('settings.systems.general.edit'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('settings/systems/general'));
});

test('operator can view general settings page', function () {
    $this->actingAs($this->operator);

    $response = $this->get(route('settings.systems.general.edit'));
    $response->assertOk();
});

test('regular user cannot view general settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.systems.general.edit'));
    $response->assertForbidden();
});

test('admin can update general settings', function () {
    $this->actingAs($this->admin);

    $response = $this->put(route('settings.systems.general.update'), [
        'booking_advance_hours' => 48,
        'booking_max_days_ahead' => 60,
        'cancellation_hours' => 4,
        'default_osh_level_id' => null,
        'display_refresh_interval' => 60,
        'media_loop_duration' => 15,
    ]);

    $response->assertRedirect();

    $settings = app(GeneralSettings::class);
    $this->assertEquals(48, $settings->booking_advance_hours);
    $this->assertEquals(60, $settings->booking_max_days_ahead);
    $this->assertEquals(4, $settings->cancellation_hours);
    $this->assertEquals(60, $settings->display_refresh_interval);
    $this->assertEquals(15, $settings->media_loop_duration);
});

test('general settings validation requires valid values', function () {
    $this->actingAs($this->admin);

    $response = $this->put(route('settings.systems.general.update'), [
        'booking_advance_hours' => -1,
        'booking_max_days_ahead' => 'not-a-number',
        'cancellation_hours' => 999,
        'display_refresh_interval' => 1,
        'media_loop_duration' => 1,
    ]);

    $response->assertSessionHasErrors([
        'booking_advance_hours',
        'booking_max_days_ahead',
        'cancellation_hours',
        'display_refresh_interval',
        'media_loop_duration',
    ]);
});
