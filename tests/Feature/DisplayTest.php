<?php

use App\Models\Booking;
use App\Models\Building;
use App\Models\Media;
use App\Models\Person;
use App\Models\Room;
use App\Models\RoomGroup;
use App\Models\User;
use App\Settings\GeneralSettings;

beforeEach(function () {
    $this->building = Building::factory()->create();
    $this->roomGroup = RoomGroup::factory()->create([
        'building_id' => $this->building->id,
    ]);
    $this->room = Room::factory()->create([
        'building_id' => $this->building->id,
    ]);
    $this->room->roomGroups()->attach($this->roomGroup->id);
    $this->leader = Person::factory()->create();
    $this->user = User::factory()->create(['role' => 'user']);
});

test('lobby display is accessible without auth', function () {
    $response = $this->get(route('display.lobby', $this->roomGroup));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('display/lobby'));
});

test('lobby display shows today bookings', function () {
    Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
        'chairperson_id' => $this->leader->id,
        'start_time' => today()->addHours(12),
        'end_time' => today()->addHours(13),
        'status' => 'approved',
    ]);

    $response = $this->get(route('display.lobby', $this->roomGroup));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('display/lobby')
        ->has('bookings', 1)
    );
});

test('lobby display only shows approved bookings', function () {
    $approved = Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
        'start_time' => today()->addHours(12),
        'end_time' => today()->addHours(13),
        'status' => 'approved',
    ]);

    Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
        'start_time' => today()->addHours(14),
        'end_time' => today()->addHours(15),
        'status' => 'pending',
    ]);

    $response = $this->get(route('display.lobby', $this->roomGroup));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('display/lobby')
        ->where('bookings.0.id', $approved->id)
    );
});

test('room display is accessible without auth', function () {
    $response = $this->get(route('display.room', $this->room));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('display/room'));
});

test('room display shows current booking', function () {
    $booking = Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
        'chairperson_id' => $this->leader->id,
        'start_time' => now()->subMinutes(30),
        'end_time' => now()->addMinutes(30),
        'status' => 'approved',
    ]);

    $response = $this->get(route('display.room', $this->room));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('display/room')
        ->where('currentBooking.id', $booking->id)
    );
});

test('room display shows null current when room is idle', function () {
    $response = $this->get(route('display.room', $this->room));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('display/room')
        ->where('currentBooking', null)
    );
});

test('osh display is accessible without auth', function () {
    $response = $this->get(route('display.osh'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('display/osh'));
});

test('osh display shows today and tomorrow bookings', function () {
    Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
        'chairperson_id' => $this->leader->id,
        'start_time' => today()->addHours(12),
        'end_time' => today()->addHours(13),
        'status' => 'approved',
    ]);

    Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
        'chairperson_id' => $this->leader->id,
        'start_time' => today()->addDay()->addHours(12),
        'end_time' => today()->addDay()->addHours(13),
        'status' => 'approved',
    ]);

    $response = $this->get(route('display.osh'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('display/osh')
        ->has('todayBookings', 1)
        ->has('tomorrowBookings', 1)
    );
});

test('osh display only shows approved bookings', function () {
    Booking::factory()->create([
        'room_id' => $this->room->id,
        'requested_id' => $this->user->id,
        'start_time' => today()->addHours(12),
        'end_time' => today()->addHours(13),
        'status' => 'pending',
    ]);

    $response = $this->get(route('display.osh'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('display/osh')
        ->where('todayBookings', collect())
    );
});

test('lobby display passes orientation from cookie', function () {
    $response = $this->withUnencryptedCookie('display_orientation', 'portrait')
        ->get(route('display.lobby', $this->roomGroup));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('orientation', 'portrait')
    );
});

test('lobby display orientation query param overrides cookie', function () {
    $response = $this->withUnencryptedCookie('display_orientation', 'portrait')
        ->get(route('display.lobby', ['roomGroup' => $this->roomGroup, 'orientation' => 'landscape']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('orientation', 'landscape')
    );
});

test('room display orientation query param overrides cookie', function () {
    $response = $this->withUnencryptedCookie('display_orientation', 'portrait')
        ->get(route('display.room', ['room' => $this->room, 'orientation' => 'landscape']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('orientation', 'landscape')
    );
});

test('room display passes refresh interval from settings', function () {
    $settings = app(GeneralSettings::class);
    $settings->display_refresh_interval = 60;
    $settings->save();

    $response = $this->get(route('display.room', $this->room));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('refreshInterval', 60)
    );
});

test('room display loads media relations', function () {
    Media::factory()->create([
        'mediable_type' => Room::class,
        'mediable_id' => $this->room->id,
        'is_active' => true,
    ]);

    $response = $this->get(route('display.room', $this->room));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('display/room')
        ->has('room.media', 1)
    );
});

test('lobby display loads media and rooms for grouping', function () {
    Media::factory()->create([
        'mediable_type' => RoomGroup::class,
        'mediable_id' => $this->roomGroup->id,
        'is_active' => true,
    ]);

    $response = $this->get(route('display.lobby', $this->roomGroup));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('roomGroup.media', 1)
        ->has('roomGroup.rooms', 1)
    );
});
