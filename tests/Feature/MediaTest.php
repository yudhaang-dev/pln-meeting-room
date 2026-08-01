<?php

use App\Models\Media;
use App\Models\Room;
use App\Models\RoomGroup;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->room = Room::factory()->create();
    $this->grouping = RoomGroup::factory()->create();
});

test('admin can view room media page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('rooms.media', $this->room));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('rooms/media'));
});

test('admin can view room grouping media page', function () {
    $this->actingAs($this->admin);

    $response = $this->get(route('room-groups.media', $this->grouping));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('room-groups/media'));
});

test('admin can upload media to room', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $file = UploadedFile::fake()->image('my photo.jpg', 800, 600);

    $response = $this->post(route('rooms.media.store', $this->room), [
        'files' => [$file],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('media', [
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
        'type' => 'image',
        'name' => 'my photo',
    ]);
});

test('admin can upload multiple media to room', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $file1 = UploadedFile::fake()->image('photo1.jpg', 800, 600);
    $file2 = UploadedFile::fake()->image('photo2.png', 800, 600);

    $response = $this->post(route('rooms.media.store', $this->room), [
        'files' => [$file1, $file2],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseCount('media', 2);
    $this->assertDatabaseHas('media', ['name' => 'photo1']);
    $this->assertDatabaseHas('media', ['name' => 'photo2']);
});

test('admin can upload media to room grouping', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $file = UploadedFile::fake()->image('banner.png', 800, 600);

    $response = $this->post(route('room-groups.media.store', $this->grouping), [
        'files' => [$file],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('media', [
        'mediable_type' => RoomGroup::class,
        'mediable_id' => $this->grouping->id,
        'type' => 'image',
        'name' => 'banner',
    ]);
});

test('admin can delete media', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $media = Media::factory()->create([
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
    ]);

    $response = $this->delete(route('rooms.media.destroy', [$this->room, $media]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('media', ['id' => $media->id]);
});

test('admin can reorder media', function () {
    $this->actingAs($this->admin);

    $media1 = Media::factory()->create([
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
        'sort_order' => 0,
    ]);
    $media2 = Media::factory()->create([
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
        'sort_order' => 1,
    ]);

    $response = $this->post(route('rooms.media.reorder', $this->room), [
        'order' => [$media2->id, $media1->id],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('media', ['id' => $media2->id, 'sort_order' => 1]);
    $this->assertDatabaseHas('media', ['id' => $media1->id, 'sort_order' => 2]);
});

test('media validation requires files', function () {
    $this->actingAs($this->admin);

    $response = $this->postJson(route('rooms.media.store', $this->room), []);

    $response->assertUnprocessable();
});

test('video upload is detected correctly', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $file = UploadedFile::fake()->create('video.mp4', 100, 'video/mp4');

    $response = $this->post(route('rooms.media.store', $this->room), [
        'files' => [$file],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('media', [
        'type' => 'video',
        'name' => 'video',
    ]);
});

test('pdf upload is detected correctly', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $response = $this->post(route('rooms.media.store', $this->room), [
        'files' => [$file],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('media', [
        'type' => 'document',
        'name' => 'document',
    ]);
});

test('media sort_order auto-increments', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    Media::factory()->create([
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
        'sort_order' => 5,
    ]);

    $file = UploadedFile::fake()->image('photo.jpg');
    $this->post(route('rooms.media.store', $this->room), [
        'files' => [$file],
    ]);

    $this->assertDatabaseHas('media', [
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
        'sort_order' => 6,
    ]);
});

test('regular user cannot upload media', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $file = UploadedFile::fake()->image('photo.jpg');

    $response = $this->post(route('rooms.media.store', $this->room), [
        'files' => [$file],
    ]);

    $response->assertForbidden();
});

test('name is derived from original filename', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');

    $file = UploadedFile::fake()->image('My Awesome Photo (1).jpg', 800, 600);

    $this->post(route('rooms.media.store', $this->room), [
        'files' => [$file],
    ]);

    $this->assertDatabaseHas('media', [
        'name' => 'My Awesome Photo (1)',
    ]);
});

test('admin can toggle media is_active', function () {
    $this->actingAs($this->admin);

    $media = Media::factory()->create([
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
        'is_active' => true,
    ]);

    $response = $this->put(route('rooms.media.toggleActive', [$this->room, $media]));

    $response->assertRedirect();
    $this->assertDatabaseHas('media', [
        'id' => $media->id,
        'is_active' => false,
    ]);
});

test('admin can upload chunk', function () {
    $this->actingAs($this->admin);

    $uploadId = 'test-upload-123';
    $file = UploadedFile::fake()->create('chunk.bin', 100, 'application/octet-stream');

    $response = $this->postJson(route('media.chunk'), [
        'upload_id' => $uploadId,
        'index' => 0,
        'total_chunks' => 2,
        'file' => $file,
    ]);

    $response->assertOk();
    $response->assertJson([
        'uploaded' => 1,
        'total' => 2,
    ]);

    $this->assertTrue(Storage::disk('local')->exists('uploads/chunks/'.$uploadId.'/0'));
});

test('chunk upload validates required fields', function () {
    $this->actingAs($this->admin);

    $response = $this->postJson(route('media.chunk'), []);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['upload_id', 'index', 'total_chunks', 'file']);
});

test('admin can assemble chunks into media', function () {
    $this->actingAs($this->admin);
    Storage::fake('public');
    $disk = Storage::disk('local');

    $uploadId = 'test-assemble-456';
    $chunkDir = 'uploads/chunks/'.$uploadId;
    $disk->makeDirectory($chunkDir);

    $chunk1 = str_repeat('A', 1024);
    $chunk2 = str_repeat('B', 512);
    $disk->put($chunkDir.'/0', $chunk1);
    $disk->put($chunkDir.'/1', $chunk2);

    $response = $this->postJson(route('media.assemble'), [
        'upload_id' => $uploadId,
        'mediable_type' => 'rooms',
        'mediable_id' => $this->room->id,
        'original_name' => 'test-image.jpg',
        'mime_type' => 'image/jpeg',
        'total_chunks' => 2,
    ]);

    $response->assertOk();
    $response->assertJsonStructure(['media' => ['id', 'path', 'type', 'name']]);

    $this->assertDatabaseHas('media', [
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
        'type' => 'image',
        'name' => 'test-image',
    ]);

    $this->assertFalse($disk->exists($chunkDir));
});

test('assemble validates missing chunk', function () {
    $this->actingAs($this->admin);
    $disk = Storage::disk('local');

    $uploadId = 'test-missing-chunk';
    $chunkDir = 'uploads/chunks/'.$uploadId;
    $disk->makeDirectory($chunkDir);
    $disk->put($chunkDir.'/0', 'data');

    $response = $this->postJson(route('media.assemble'), [
        'upload_id' => $uploadId,
        'mediable_type' => 'rooms',
        'mediable_id' => $this->room->id,
        'original_name' => 'test.jpg',
        'mime_type' => 'image/jpeg',
        'total_chunks' => 2,
    ]);

    $response->assertStatus(422);
});

test('assemble validates mediable_type', function () {
    $this->actingAs($this->admin);

    $response = $this->postJson(route('media.assemble'), [
        'upload_id' => 'test',
        'mediable_type' => 'invalid',
        'mediable_id' => $this->room->id,
        'original_name' => 'test.jpg',
        'mime_type' => 'image/jpeg',
        'total_chunks' => 1,
    ]);

    $response->assertUnprocessable();
});

test('regular user cannot upload chunks', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $file = UploadedFile::fake()->create('chunk.bin', 100, 'application/octet-stream');

    $response = $this->postJson(route('media.chunk'), [
        'upload_id' => 'test',
        'index' => 0,
        'total_chunks' => 1,
        'file' => $file,
    ]);

    $response->assertForbidden();
});

test('regular user cannot assemble chunks', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->postJson(route('media.assemble'), [
        'upload_id' => 'test',
        'mediable_type' => 'rooms',
        'mediable_id' => $this->room->id,
        'original_name' => 'test.jpg',
        'mime_type' => 'image/jpeg',
        'total_chunks' => 1,
    ]);

    $response->assertForbidden();
});
