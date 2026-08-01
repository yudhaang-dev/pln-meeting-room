<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Notifications\BookingStatusNotification;
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
        'start_time' => now()->addDays(2)->setTime(9, 0),
        'end_time' => now()->addDays(2)->setTime(10, 0),
        'participants_count' => 5,
        'attachment' => $file,
    ]);

    Notification::assertSentTo($this->admin, BookingStatusNotification::class);
    Notification::assertSentTo($this->operator, BookingStatusNotification::class);
    Notification::assertNotSentTo($this->user, BookingStatusNotification::class);
});

test('booking approval notifies user', function () {
    Notification::fake();

    $booking = Booking::factory()->pending()->create([
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
    ]);

    $this->actingAs($this->operator);

    $this->post(route('bookings.approve', $booking));

    Notification::assertSentTo($this->user, BookingStatusNotification::class);
    Notification::assertNotSentTo($this->operator, BookingStatusNotification::class);
});

test('booking rejection notifies user', function () {
    Notification::fake();

    $booking = Booking::factory()->pending()->create([
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
    ]);

    $this->actingAs($this->operator);

    $this->postJson(route('bookings.reject', $booking), [
        'reason' => 'Room under maintenance',
    ]);

    Notification::assertSentTo($this->user, BookingStatusNotification::class);
});

test('user can view notifications page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('notifications.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('notifications/index'));
});

test('user can get unread count', function () {
    $this->actingAs($this->user);

    $booking = Booking::factory()->create(['requested_id' => $this->user->id, 'room_id' => $this->room->id]);
    $this->user->notify(new BookingStatusNotification('Booking', 'New booking', $booking->toArray()));

    $response = $this->get(route('notifications.unreadCount'));
    $response->assertOk();
    $response->assertJson(['count' => 1]);
});

test('user can mark notification as read', function () {
    $this->actingAs($this->user);

    $booking = Booking::factory()->create(['requested_id' => $this->user->id, 'room_id' => $this->room->id]);
    $this->user->notify(new BookingStatusNotification('Booking', 'New booking', $booking->toArray()));

    $notification = $this->user->unreadNotifications->first();

    $response = $this->post(route('notifications.markAsRead', $notification->id));
    $response->assertRedirect();

    $this->assertNotNull($notification->refresh()->read_at);
});

test('user can mark all notifications as read', function () {
    $this->actingAs($this->user);

    $booking = Booking::factory()->create(['requested_id' => $this->user->id, 'room_id' => $this->room->id]);
    $this->user->notify(new BookingStatusNotification('Booking', 'One', $booking->toArray()));
    $this->user->notify(new BookingStatusNotification('Booking', 'Two', $booking->toArray()));

    $this->assertEquals(2, $this->user->unreadNotifications()->count());

    $response = $this->post(route('notifications.markAllAsRead'));
    $response->assertRedirect();

    $this->assertEquals(0, $this->user->unreadNotifications()->count());
});

test('notification contains correct data', function () {
    $booking = Booking::factory()->create([
        'requested_id' => $this->user->id,
        'room_id' => $this->room->id,
        'title' => 'Important Meeting',
    ]);

    $notification = new BookingStatusNotification('Booking', 'Important Meeting', $booking->toArray());
    $data = $notification->toArray($this->admin);

    $this->assertEquals('Booking', $data['resource']);
    $this->assertStringContainsString('Important Meeting', $data['message']);
    $this->assertEquals($booking->id, $data['payload']['id']);
    $this->assertEquals('Important Meeting', $data['payload']['title']);
});

test('user can get recent unread notifications', function () {
    $this->actingAs($this->user);

    $booking = Booking::factory()->create(['requested_id' => $this->user->id, 'room_id' => $this->room->id]);
    $this->user->notify(new BookingStatusNotification('Booking', 'One', $booking->toArray()));
    $this->user->notify(new BookingStatusNotification('Booking', 'Two', $booking->toArray()));

    $response = $this->get(route('notifications.recent'));
    $response->assertOk();
    $response->assertJsonStructure([
        'count',
        'notifications' => [
            '*' => ['id', 'data', 'created_at'],
        ],
    ]);
    $response->assertJsonPath('count', 2);
});
