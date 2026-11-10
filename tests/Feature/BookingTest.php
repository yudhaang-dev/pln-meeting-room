<?php

use App\Models\Booking;
use App\Models\OshLevel;
use App\Models\Person;
use App\Models\Room;
use App\Models\User;
use App\Settings\GeneralSettings;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'user']);
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->room = Room::factory()->create();
    $this->leader = Person::factory()->create();
    $this->oshLevel = OshLevel::factory()->create();
});

test('user can view bookings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('bookings.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('bookings/index'));
});

test('user can create a booking', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $response = $this->post(route('bookings.store'), [
        'room_id' => $this->room->id,
        'chairperson_id' => $this->leader->id,
        'title' => 'Team Meeting',
        'description' => 'Weekly sync',
        'start_time' => now()->addDays(2)->setTime(9, 0),
        'end_time' => now()->addDays(2)->setTime(10, 0),
        'participants_count' => 15,
        'attachment' => $file,
        'qr_attendance' => UploadedFile::fake()->image('qr.png', 300, 300),
    ]);

    $response->assertRedirect(route('bookings.index'));
    $this->assertDatabaseHas('bookings', [
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
        'title' => 'Team Meeting',
        'status' => 'pending',
    ]);
    $booking = Booking::where('title', 'Team Meeting')->first();
    $this->assertStringStartsWith('bookings/', $booking->attachment_path);
});

test('booking requires attachment', function () {
    $this->actingAs($this->user);

    $response = $this->postJson(route('bookings.store'), [
        'room_id' => $this->room->id,
        'title' => 'Team Meeting',
        'start_time' => now()->addDays(2)->setTime(9, 0),
        'end_time' => now()->addDays(2)->setTime(10, 0),
        'participants_count' => 5,
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['attachment']);
});

test('booking rejects overlapping time slots', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    Booking::factory()->create([
        'room_id' => $this->room->id,
        'start_time' => now()->addDays(2)->setTime(9, 0),
        'end_time' => now()->addDays(2)->setTime(11, 0),
        'status' => 'approved',
    ]);

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $response = $this->postJson(route('bookings.store'), [
        'room_id' => $this->room->id,
        'title' => 'Overlapping Meeting',
        'start_time' => now()->addDays(2)->setTime(10, 0)->toDateTimeString(),
        'end_time' => now()->addDays(2)->setTime(12, 0)->toDateTimeString(),
        'participants_count' => 5,
        'attachment' => $file,
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['room_id']);
});

test('booking allows non-overlapping time slots', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    Booking::factory()->create([
        'room_id' => $this->room->id,
        'start_time' => now()->addDays(2)->setTime(9, 0),
        'end_time' => now()->addDays(2)->setTime(11, 0),
        'status' => 'approved',
    ]);

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $response = $this->post(route('bookings.store'), [
        'room_id' => $this->room->id,
        'chairperson_id' => $this->leader->id,
        'title' => 'Non-overlapping Meeting',
        'start_time' => now()->addDays(2)->setTime(11, 0)->toDateTimeString(),
        'end_time' => now()->addDays(2)->setTime(12, 0)->toDateTimeString(),
        'participants_count' => 5,
        'attachment' => $file,
        'qr_attendance' => UploadedFile::fake()->image('qr.png', 300, 300),
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('bookings', [
        'title' => 'Non-overlapping Meeting',
        'status' => 'pending',
    ]);
});

test('booking rejects overlap with pending bookings', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    Booking::factory()->create([
        'room_id' => $this->room->id,
        'start_time' => now()->addDays(2)->setTime(14, 0),
        'end_time' => now()->addDays(2)->setTime(16, 0),
        'status' => 'pending',
    ]);

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $response = $this->postJson(route('bookings.store'), [
        'room_id' => $this->room->id,
        'title' => 'Conflict with Pending',
        'start_time' => now()->addDays(2)->setTime(15, 0)->toDateTimeString(),
        'end_time' => now()->addDays(2)->setTime(17, 0)->toDateTimeString(),
        'participants_count' => 5,
        'attachment' => $file,
    ]);

    $response->assertUnprocessable();
});

test('user can view their own bookings', function () {
    $this->actingAs($this->user);

    Booking::factory()->create(['requested_id' => $this->user->id]);
    Booking::factory()->create(['requested_id' => $this->user->id]);

    $response = $this->get(route('bookings.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->has('bookings.data'));
});

test('booking requires valid room', function () {
    $this->actingAs($this->user);

    $response = $this->postJson(route('bookings.store'), [
        'room_id' => 9999,
        'title' => 'Test',
        'start_time' => now()->addDays(1),
        'end_time' => now()->addDays(1)->addHours(1),
        'participants_count' => 1,
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['room_id']);
});

test('booking rejected when within advance hours window', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    $settings = app(GeneralSettings::class);
    $settings->booking_advance_hours = 48;
    $settings->save();

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $response = $this->postJson(route('bookings.store'), [
        'room_id' => $this->room->id,
        'title' => 'Too Soon',
        'start_time' => now()->addHours(24),
        'end_time' => now()->addHours(25),
        'participants_count' => 5,
        'attachment' => $file,
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['start_time']);
    $response->assertJsonFragment(['start_time' => ['Booking harus diajukan minimal 48 jam sebelumnya.']]);
});

test('booking rejected when beyond max days ahead', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    $settings = app(GeneralSettings::class);
    $settings->booking_max_days_ahead = 7;
    $settings->save();

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $response = $this->postJson(route('bookings.store'), [
        'room_id' => $this->room->id,
        'title' => 'Too Far Ahead',
        'start_time' => now()->addDays(14),
        'end_time' => now()->addDays(14)->addHour(),
        'participants_count' => 5,
        'attachment' => $file,
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['start_time']);
    $response->assertJsonFragment(['start_time' => ['Booking tidak dapat diajukan lebih dari 7 hari ke depan.']]);
});

test('booking allowed when within advance hours window', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    $settings = app(GeneralSettings::class);
    $settings->booking_advance_hours = 12;
    $settings->save();

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $response = $this->post(route('bookings.store'), [
        'room_id' => $this->room->id,
        'chairperson_id' => $this->leader->id,
        'title' => 'OK Booking',
        'start_time' => now()->addDays(2)->setTime(9, 0),
        'end_time' => now()->addDays(2)->setTime(10, 0),
        'participants_count' => 5,
        'attachment' => $file,
        'qr_attendance' => UploadedFile::fake()->image('qr.png', 300, 300),
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('bookings', [
        'title' => 'OK Booking',
        'status' => 'pending',
    ]);
});

test('booking allowed when within max days ahead', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    $settings = app(GeneralSettings::class);
    $settings->booking_max_days_ahead = 60;
    $settings->save();

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $response = $this->post(route('bookings.store'), [
        'room_id' => $this->room->id,
        'chairperson_id' => $this->leader->id,
        'title' => 'Far Future OK',
        'start_time' => now()->addDays(30)->setTime(9, 0),
        'end_time' => now()->addDays(30)->setTime(10, 0),
        'participants_count' => 5,
        'attachment' => $file,
        'qr_attendance' => UploadedFile::fake()->image('qr.png', 300, 300),
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('bookings', [
        'title' => 'Far Future OK',
        'status' => 'pending',
    ]);
});

test('user can view their own booking detail', function () {
    $this->actingAs($this->user);

    $booking = Booking::factory()->create([
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
        'chairperson_id' => $this->leader->id,
    ]);

    $response = $this->get(route('bookings.show', $booking));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('bookings/show'));
});

test('user cannot view other users booking detail', function () {
    $this->actingAs($this->user);

    $otherUser = User::factory()->create(['role' => 'user']);
    $booking = Booking::factory()->create([
        'requested_id' => $otherUser->id,
    ]);

    $response = $this->get(route('bookings.show', $booking));

    $response->assertForbidden();
});

test('booking detail shows osh level', function () {
    $this->actingAs($this->user);

    $booking = Booking::factory()->create([
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
        'participants_count' => 15,
    ]);

    $response = $this->get(route('bookings.show', $booking));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('bookings/show')
        ->has('booking.osh_level')
    );
});

test('unauthenticated user cannot view booking detail', function () {
    $booking = Booking::factory()->create();

    $response = $this->get(route('bookings.show', $booking));

    $response->assertRedirect('/login');
});

test('booking creation is rate limited', function () {
    $this->actingAs($this->user);
    Storage::fake('public');

    for ($i = 0; $i < 10; $i++) {
        $this->post(route('bookings.store'), [
            'room_id' => $this->room->id,
            'title' => "Booking {$i}",
            'start_time' => now()->addDays(2)->setTime(9, 0)->addMinutes($i * 60),
            'end_time' => now()->addDays(2)->setTime(9, 0)->addMinutes($i * 60 + 30),
            'participants_count' => 5,
            'attachment' => UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf'),
        ]);
    }

    $response = $this->post(route('bookings.store'), [
        'room_id' => $this->room->id,
        'title' => 'Over Limit',
        'start_time' => now()->addDays(2)->setTime(20, 0),
        'end_time' => now()->addDays(2)->setTime(21, 0),
        'participants_count' => 5,
        'attachment' => UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf'),
    ]);

    $response->assertTooManyRequests();
});
