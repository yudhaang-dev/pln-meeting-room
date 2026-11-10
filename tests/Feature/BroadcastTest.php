<?php

use App\Events\BookingCreated;
use App\Events\BookingUpdated;
use App\Events\PublicBroadcast;
use App\Models\Booking;
use App\Models\OshLevel;
use App\Models\Person;
use App\Models\Room;
use App\Models\RoomGroup;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'user']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->room = Room::factory()->create();
    $this->roomGroup = RoomGroup::factory()->create();
    $this->room->roomGroups()->attach($this->roomGroup->id);
    $this->leader = Person::factory()->create();
    $this->oshLevel = OshLevel::factory()->create();
});

test('booking updated broadcasts to osh for any approved booking', function () {
    $booking = Booking::factory()->approved()->create([
        'room_id' => $this->room->id,
        'start_time' => now()->addDays(3),
        'end_time' => now()->addDays(3)->addHours(1),
    ]);

    $channels = (new BookingUpdated($booking))->broadcastOn();

    expect(collect($channels)->pluck('name')->all())->toBe(['Display.Osh']);
});

test('booking updated broadcasts to room and room group when approved today', function () {
    $booking = Booking::factory()->approved()->create([
        'room_id' => $this->room->id,
        'start_time' => today()->setTime(12, 0),
        'end_time' => today()->setTime(13, 0),
    ]);

    $channels = (new BookingUpdated($booking))->broadcastOn();

    expect(collect($channels)->pluck('name')->sort()->values()->all())->toBe([
        'Display.Osh',
        'Display.Room.'.$this->room->id,
        'Display.RoomGroup.'.$this->roomGroup->id,
    ]);
});

test('booking updated does not broadcast for pending bookings', function () {
    $booking = Booking::factory()->pending()->create([
        'room_id' => $this->room->id,
        'start_time' => today()->setTime(12, 0),
        'end_time' => today()->setTime(13, 0),
    ]);

    $channels = (new BookingUpdated($booking))->broadcastOn();

    expect($channels)->toBe([]);
});

test('public broadcast uses the event name as broadcastAs', function () {
    $event = new PublicBroadcast('Display.Room.1', 'MediaUpdated', []);

    expect($event->broadcastAs())->toBe('MediaUpdated');
});

test('booking approval dispatches booking updated', function () {
    Event::fake();

    $booking = Booking::factory()->pending()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
    ]);

    $this->actingAs($this->operator)->post(route('bookings.approve', $booking));

    Event::assertDispatched(BookingUpdated::class);
});

test('booking rejection dispatches booking updated', function () {
    Event::fake();

    $booking = Booking::factory()->pending()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
    ]);

    $this->actingAs($this->operator)->postJson(route('bookings.reject', $booking), [
        'reason' => 'Room under maintenance',
    ]);

    Event::assertDispatched(BookingUpdated::class);
});

test('booking update dispatches booking updated', function () {
    Event::fake();

    $booking = Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
    ]);

    $this->actingAs($this->operator)->put(route('bookings.update', $booking), [
        'room_id' => $this->room->id,
        'title' => 'Updated Title',
        'start_time' => now()->addDays(1)->setTime(9, 0),
        'end_time' => now()->addDays(1)->setTime(10, 0),
        'participants_count' => 5,
    ]);

    Event::assertDispatched(BookingUpdated::class);
});

test('booking deletion dispatches booking updated', function () {
    Event::fake();

    $booking = Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
    ]);

    $this->actingAs($this->operator)->delete(route('bookings.destroy', $booking));

    Event::assertDispatched(BookingUpdated::class);
});

test('booking creation dispatches booking created but not booking updated', function () {
    Event::fake();
    Storage::fake('public');

    $file = UploadedFile::fake()->create('attachment.pdf', 100, 'application/pdf');

    $this->actingAs($this->user)->post(route('bookings.store'), [
        'room_id' => $this->room->id,
        'chairperson_id' => $this->leader->id,
        'osh_level_id' => $this->oshLevel->id,
        'title' => 'New Booking',
        'start_time' => now()->addDays(2)->setTime(9, 0),
        'end_time' => now()->addDays(2)->setTime(10, 0),
        'participants_count' => 5,
        'attachment' => $file,
        'qr_attendance' => UploadedFile::fake()->image('qr.png', 300, 300),
    ]);

    Event::assertDispatched(BookingCreated::class);
    Event::assertNotDispatched(BookingUpdated::class);
});

test('media upload broadcasts media updated to the room channel', function () {
    Event::fake();
    Storage::fake('public');

    $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

    $this->actingAs($this->operator)->post(route('rooms.media.store', $this->room), [
        'files' => [$file],
    ]);

    Event::assertDispatched(PublicBroadcast::class, function (PublicBroadcast $event) {
        return $event->channelName === 'Display.Room.'.$this->room->id
            && $event->eventName === 'MediaUpdated';
    });
});
