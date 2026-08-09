<?php

use App\Events\PublicBroadcast;
use App\Models\Media;
use App\Models\Room;
use App\Models\RoomGroup;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->user = User::factory()->create(['role' => 'user']);
});

test('admin can view global media page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('infografis.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('infografis/index'));
});

test('authenticated user can view global media page', function () {
    $this->actingAs($this->user);

    $this->get(route('infografis.index'))->assertOk();
});

test('guest cannot access global media page', function () {
    $this->get(route('infografis.index'))->assertRedirect(route('login'));
});

test('admin can upload global media', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

    $response = $this->post(route('infografis.store'), [
        'files' => [$file],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('media', [
        'mediable_type' => null,
        'mediable_id' => null,
        'name' => 'photo',
    ]);
});

test('global media upload broadcasts media updated to the global channel', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');
    Event::fake();

    $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

    $this->post(route('infografis.store'), [
        'files' => [$file],
    ]);

    Event::assertDispatched(PublicBroadcast::class, function (PublicBroadcast $event) {
        return $event->channelName === 'Display.Global'
            && $event->eventName === 'MediaUpdated';
    });
});

test('regular user cannot upload global media', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

    $response = $this->post(route('infografis.store'), [
        'files' => [$file],
    ]);

    $response->assertForbidden();
});

test('admin can reorder global media', function () {
    $this->actingAs($this->admin);

    $media1 = Media::factory()->create(['mediable_type' => null, 'mediable_id' => null, 'sort_order' => 1]);
    $media2 = Media::factory()->create(['mediable_type' => null, 'mediable_id' => null, 'sort_order' => 2]);

    $this->post(route('infografis.reorder'), [
        'order' => [$media2->id, $media1->id],
    ]);

    $this->assertDatabaseHas('media', ['id' => $media2->id, 'sort_order' => 1]);
    $this->assertDatabaseHas('media', ['id' => $media1->id, 'sort_order' => 2]);
});

test('admin can toggle global media active state', function () {
    $this->actingAs($this->admin);

    $media = Media::factory()->create([
        'mediable_type' => null,
        'mediable_id' => null,
        'is_active' => true,
    ]);

    $response = $this->put(route('infografis.toggleActive', $media));

    $response->assertRedirect();
    $this->assertDatabaseHas('media', [
        'id' => $media->id,
        'is_active' => false,
    ]);
});

test('admin can delete global media', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $media = Media::factory()->create(['mediable_type' => null, 'mediable_id' => null]);

    $response = $this->delete(route('infografis.destroy', $media));

    $response->assertRedirect();
    $this->assertDatabaseMissing('media', ['id' => $media->id]);
});

test('admin can bulk delete global media', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $media1 = Media::factory()->create(['mediable_type' => null, 'mediable_id' => null]);
    $media2 = Media::factory()->create(['mediable_type' => null, 'mediable_id' => null]);

    $this->post(route('infografis.bulkDelete'), [
        'media_ids' => [$media1->id, $media2->id],
    ]);

    $this->assertDatabaseMissing('media', ['id' => $media1->id]);
    $this->assertDatabaseMissing('media', ['id' => $media2->id]);
});

test('admin can assemble global media chunks', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $this->postJson(route('media.chunk'), [
        'upload_id' => 'test-global',
        'index' => 0,
        'total_chunks' => 1,
        'file' => UploadedFile::fake()->image('photo.jpg', 800, 600),
    ])->assertOk();

    $response = $this->postJson(route('media.assemble'), [
        'upload_id' => 'test-global',
        'mediable_type' => 'global',
        'mediable_id' => 0,
        'original_name' => 'photo.jpg',
        'mime_type' => 'image/jpeg',
        'total_chunks' => 1,
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('media', [
        'mediable_type' => null,
        'mediable_id' => null,
        'name' => 'photo',
    ]);
});

test('room display receives active global media', function () {
    $room = Room::factory()->create();
    Media::factory()->create(['mediable_type' => null, 'mediable_id' => null, 'is_active' => true]);

    $this->get(route('display.room', $room))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('media', 1));
});

test('lobby display receives active global media', function () {
    $roomGroup = RoomGroup::factory()->create();
    Media::factory()->create(['mediable_type' => null, 'mediable_id' => null, 'is_active' => true]);

    $this->get(route('display.lobby', $roomGroup))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('media', 1));
});
