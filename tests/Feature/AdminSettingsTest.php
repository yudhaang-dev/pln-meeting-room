<?php

use App\Events\PublicBroadcast;
use App\Models\User;
use App\Settings\GeneralSettings;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

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
        'display_refresh_interval' => 60,
        'media_loop_duration' => 15,
    ]);

    $response->assertRedirect();

    $settings = app(GeneralSettings::class);
    $this->assertEquals(48, $settings->booking_advance_hours);
    $this->assertEquals(60, $settings->booking_max_days_ahead);
    $this->assertEquals(60, $settings->display_refresh_interval);
    $this->assertEquals(15, $settings->media_loop_duration);
});

test('updating general settings broadcasts settings updated to displays', function () {
    $this->actingAs($this->admin);
    Event::fake();

    $this->put(route('settings.systems.general.update'), [
        'booking_advance_hours' => 48,
        'booking_max_days_ahead' => 60,
        'display_refresh_interval' => 60,
        'media_loop_duration' => 15,
    ]);

    Event::assertDispatched(PublicBroadcast::class, function (PublicBroadcast $event) {
        return $event->channelName === 'Display.Global'
            && $event->eventName === 'SettingsUpdated';
    });
});

test('admin can upload notification audio', function () {
    Storage::fake('public');

    $this->actingAs($this->admin);

    $response = $this->put(route('settings.systems.general.update'), [
        'booking_advance_hours' => 24,
        'booking_max_days_ahead' => 30,
        'display_refresh_interval' => 30,
        'media_loop_duration' => 10,
        'audio_notification' => UploadedFile::fake()->create('notif.mp3', 100, 'audio/mpeg'),
    ]);

    $response->assertRedirect();

    $settings = app(GeneralSettings::class);
    $this->assertNotNull($settings->audio_notification);
    Storage::disk('public')->assertExists($settings->audio_notification);
});

test('general settings validation requires valid values', function () {
    $this->actingAs($this->admin);

    $response = $this->put(route('settings.systems.general.update'), [
        'booking_advance_hours' => -1,
        'booking_max_days_ahead' => 'not-a-number',
        'display_refresh_interval' => 1,
        'media_loop_duration' => 1,
        'audio_notification' => UploadedFile::fake()->create('notif.exe', 100),
    ]);

    $response->assertSessionHasErrors([
        'booking_advance_hours',
        'booking_max_days_ahead',
        'display_refresh_interval',
        'media_loop_duration',
        'audio_notification',
    ]);
});
