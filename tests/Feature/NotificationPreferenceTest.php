<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('authenticated user can view notification settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.account.notification.edit'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('settings/account/notification'));
});

test('guest cannot view notification settings page', function () {
    $response = $this->get(route('settings.account.notification.edit'));
    $response->assertRedirect(route('login'));
});

test('user can upload custom notification audio', function () {
    Storage::fake('public');

    $this->actingAs($this->user);

    $response = $this->put(route('settings.account.notification.update'), [
        'audio_notification' => UploadedFile::fake()->create('my-notif.mp3', 100, 'audio/mpeg'),
    ]);

    $response->assertRedirect();

    $audioPath = $this->user->fresh()->notification_audio;
    $this->assertNotNull($audioPath);
    Storage::disk('public')->assertExists($audioPath);
});

test('user can reset notification audio to system default', function () {
    Storage::fake('public');

    $this->user->notification_audio = 'users/notification-audio/old.mp3';
    $this->user->save();
    Storage::disk('public')->put('users/notification-audio/old.mp3', 'audio');

    $this->actingAs($this->user);

    $response = $this->put(route('settings.account.notification.update'), [
        'remove_audio' => true,
    ]);

    $response->assertRedirect();

    $this->assertNull($this->user->fresh()->notification_audio);
    Storage::disk('public')->assertMissing('users/notification-audio/old.mp3');
});

test('notification audio validation rejects invalid files', function () {
    Storage::fake('public');

    $this->actingAs($this->user);

    $response = $this->put(route('settings.account.notification.update'), [
        'audio_notification' => UploadedFile::fake()->create('notif.exe', 100),
    ]);

    $response->assertSessionHasErrors('audio_notification');
});
