<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Notifications\BookingApproved;
use App\Notifications\BookingCreated;
use App\Notifications\BookingRejected;
use App\Settings\GeneralSettings;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'user']);
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->room = Room::factory()->create();
});

test('booking creation notifies operators and admins', function () {
    Notification::fake();
    Storage::fake('public');

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $this->actingAs($this->user);

    $this->post(route('bookings.store'), [
        'room_id' => $this->room->id,
        'title' => 'Team Meeting',
        'start_time' => now()->addDays(1)->setTime(9, 0),
        'end_time' => now()->addDays(1)->setTime(10, 0),
        'participants_count' => 5,
        'attachment' => $file,
    ]);

    Notification::assertSentTo($this->admin, BookingCreated::class);
    Notification::assertSentTo($this->operator, BookingCreated::class);
    Notification::assertNotSentTo($this->user, BookingCreated::class);
});

test('auto-approved booking does not notify operators', function () {
    Notification::fake();
    Storage::fake('public');

    $settings = app(GeneralSettings::class);
    $settings->auto_approve_bookings = true;
    $settings->save();

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $this->actingAs($this->user);

    $this->post(route('bookings.store'), [
        'room_id' => $this->room->id,
        'title' => 'Auto Approved',
        'start_time' => now()->addDays(1)->setTime(9, 0),
        'end_time' => now()->addDays(1)->setTime(10, 0),
        'participants_count' => 5,
        'attachment' => $file,
    ]);

    Notification::assertNothingSent();
});

test('booking approval notifies user', function () {
    Notification::fake();

    $booking = Booking::factory()->pending()->create([
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
    ]);

    $this->actingAs($this->operator);

    $this->post(route('admin.bookings.approve', $booking));

    Notification::assertSentTo($this->user, BookingApproved::class);
    Notification::assertNotSentTo($this->operator, BookingApproved::class);
});

test('booking rejection notifies user', function () {
    Notification::fake();

    $booking = Booking::factory()->pending()->create([
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
    ]);

    $this->actingAs($this->operator);

    $this->postJson(route('admin.bookings.reject', $booking), [
        'reason' => 'Room under maintenance',
    ]);

    Notification::assertSentTo($this->user, BookingRejected::class);
});

test('user can view notifications page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('notifications.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('notifications/index'));
});

test('user can get unread count', function () {
    $this->actingAs($this->user);

    $this->user->notify(new BookingCreated(
        Booking::factory()->create(['requested_id' => $this->user->id, 'room_id' => $this->room->id])
    ));

    $response = $this->get(route('notifications.unread-count'));
    $response->assertOk();
    $response->assertJson(['count' => 1]);
});

test('user can mark notification as read', function () {
    $this->actingAs($this->user);

    $booking = Booking::factory()->create(['requested_id' => $this->user->id, 'room_id' => $this->room->id]);
    $this->user->notify(new BookingCreated($booking));

    $notification = $this->user->notifications->first();

    $response = $this->post(route('notifications.markAsRead', $notification->id));
    $response->assertOk();
    $response->assertJson(['count' => 0]);

    $notification->refresh();
    $this->assertNotNull($notification->read_at);
});

test('user can mark all notifications as read', function () {
    $this->actingAs($this->user);

    $booking = Booking::factory()->create(['requested_id' => $this->user->id, 'room_id' => $this->room->id]);
    $this->user->notify(new BookingCreated($booking));
    $this->user->notify(new BookingCreated($booking));

    $this->assertEquals(2, $this->user->unreadNotifications()->count());

    $response = $this->post(route('notifications.markAllAsRead'));
    $response->assertOk();
    $response->assertJson(['count' => 0]);

    $this->assertEquals(0, $this->user->unreadNotifications()->count());
});

test('notification contains correct data', function () {
    $booking = Booking::factory()->create([
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
        'title' => 'Important Meeting',
    ]);

    $notification = new BookingCreated($booking);
    $data = $notification->toArray($this->admin);

    $this->assertEquals('booking_created', $data['type']);
    $this->assertEquals($booking->id, $data['booking_id']);
    $this->assertStringContainsString('Important Meeting', $data['message']);
    $this->assertEquals('Important Meeting', $data['booking']['title']);
});
