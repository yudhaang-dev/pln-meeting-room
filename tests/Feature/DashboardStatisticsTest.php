<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Services\DashboardStatistics;

test('monthly events are zero-filled across 12 months including the current month', function () {
    Booking::factory()->approved()->create(['start_time' => now()]);

    $data = app(DashboardStatistics::class)->monthlyEvents();

    expect($data)->toHaveCount(12);

    collect(array_slice($data, 0, 11))->each(function (array $month) {
        expect($month['total'])->toBe(0);
    });

    expect(end($data))->toMatchArray(['total' => 1, 'approved' => 1, 'rejected' => 0]);
});

test('monthly events aggregate total, approved, and rejected', function () {
    Booking::factory()->approved()->create(['start_time' => now()]);
    Booking::factory()->approved()->create(['start_time' => now()]);
    Booking::factory()->rejected()->create(['start_time' => now()]);
    Booking::factory()->pending()->create(['start_time' => now()]);

    $data = app(DashboardStatistics::class)->monthlyEvents();
    $current = end($data);

    expect($current)->toMatchArray(['total' => 4, 'approved' => 2, 'rejected' => 1]);
});

test('monthly participants only count approved events', function () {
    Booking::factory()->approved()->create([
        'start_time' => now(),
        'participants_count' => 10,
    ]);

    Booking::factory()->rejected()->create([
        'start_time' => now(),
        'participants_count' => 5,
    ]);

    Booking::factory()->pending()->create([
        'start_time' => now(),
        'participants_count' => 3,
    ]);

    $data = app(DashboardStatistics::class)->monthlyParticipants();
    $current = end($data);

    expect($current['participants'])->toBe(10);
});

test('events by status returns all-time counts per status', function () {
    Booking::factory()->approved()->create();
    Booking::factory()->approved()->create();
    Booking::factory()->rejected()->create();

    $data = collect(app(DashboardStatistics::class)->eventsByStatus())->keyBy('name');

    expect($data['approved']['value'])->toBe(2)
        ->and($data['rejected']['value'])->toBe(1);
});

test('participants by room groups top rooms and the rest as others', function () {
    $rooms = collect(['A', 'B', 'C', 'D'])->map(
        fn (string $name) => Room::factory()->create(['name' => "Ruang {$name}"]),
    );

    Booking::factory()->approved()->create([
        'room_id' => $rooms[0]->id,
        'participants_count' => 30,
    ]);

    Booking::factory()->approved()->create([
        'room_id' => $rooms[0]->id,
        'participants_count' => 40,
    ]);

    Booking::factory()->approved()->create([
        'room_id' => $rooms[1]->id,
        'participants_count' => 50,
    ]);

    Booking::factory()->approved()->create([
        'room_id' => $rooms[2]->id,
        'participants_count' => 40,
    ]);

    Booking::factory()->approved()->create([
        'room_id' => $rooms[3]->id,
        'participants_count' => 10,
    ]);

    Booking::factory()->rejected()->create([
        'room_id' => $rooms[3]->id,
        'participants_count' => 999,
    ]);

    $data = app(DashboardStatistics::class)->participantsByRoom();

    expect($data)->toHaveCount(4)
        ->and($data[0])->toMatchArray(['name' => 'Ruang A', 'value' => 70])
        ->and($data[1])->toMatchArray(['name' => 'Ruang B', 'value' => 50])
        ->and($data[2])->toMatchArray(['name' => 'Ruang C', 'value' => 40])
        ->and($data[3])->toMatchArray(['name' => 'Lainnya', 'value' => 10]);
});

test('top users ranks users by approved event count', function () {
    $users = collect(['A', 'B', 'C', 'D'])->map(
        fn (string $name) => User::factory()->create(['name' => "User {$name}"]),
    );

    foreach (range(1, 3) as $i) {
        Booking::factory()->approved()->create(['requested_id' => $users[0]->id]);
    }

    Booking::factory()->rejected()->create(['requested_id' => $users[0]->id]);

    Booking::factory()->approved()->create(['requested_id' => $users[1]->id]);
    Booking::factory()->approved()->create(['requested_id' => $users[1]->id]);
    Booking::factory()->approved()->create(['requested_id' => $users[2]->id]);

    $data = app(DashboardStatistics::class)->topUsers();

    expect($data)->toHaveCount(3)
        ->and($data[0])->toMatchArray(['name' => 'User A', 'value' => 3])
        ->and($data[1])->toMatchArray(['name' => 'User B', 'value' => 2])
        ->and($data[2])->toMatchArray(['name' => 'User C', 'value' => 1]);
});

test('users share includes the grouped remainder', function () {
    $users = collect(['A', 'B', 'C', 'D'])->map(
        fn (string $name) => User::factory()->create(['name' => "User {$name}"]),
    );

    foreach ($users as $user) {
        Booking::factory()->approved()->create(['requested_id' => $user->id]);
    }

    $data = app(DashboardStatistics::class)->usersShare();

    expect($data)->toHaveCount(4)
        ->and($data[3])->toMatchArray(['name' => 'Lainnya', 'value' => 1]);
});

test('top rooms ranks rooms by approved booking count', function () {
    $rooms = collect(['A', 'B', 'C'])->map(
        fn (string $name) => Room::factory()->create(['name' => "Ruang {$name}"]),
    );

    Booking::factory()->approved()->create(['room_id' => $rooms[0]->id]);
    Booking::factory()->approved()->create(['room_id' => $rooms[0]->id]);
    Booking::factory()->approved()->create(['room_id' => $rooms[1]->id]);
    Booking::factory()->rejected()->create(['room_id' => $rooms[1]->id]);
    Booking::factory()->approved()->create(['room_id' => $rooms[2]->id]);

    $data = app(DashboardStatistics::class)->topRooms();

    expect($data)->toHaveCount(3)
        ->and($data[0])->toMatchArray(['name' => 'Ruang A', 'value' => 2])
        ->and($data[1])->toMatchArray(['name' => 'Ruang B', 'value' => 1])
        ->and($data[2])->toMatchArray(['name' => 'Ruang C', 'value' => 1]);
});

test('rooms share includes the grouped remainder', function () {
    $rooms = collect(['A', 'B', 'C', 'D'])->map(
        fn (string $name) => Room::factory()->create(['name' => "Ruang {$name}"]),
    );

    foreach ($rooms as $room) {
        Booking::factory()->approved()->create(['room_id' => $room->id]);
    }

    $data = app(DashboardStatistics::class)->roomsShare();

    expect($data)->toHaveCount(4)
        ->and($data[3])->toMatchArray(['name' => 'Lainnya', 'value' => 1]);
});

test('monthly users break down top users and the rest per month', function () {
    $budi = User::factory()->create(['name' => 'Budi']);
    $andi = User::factory()->create(['name' => 'Andi']);
    $hendra = User::factory()->create(['name' => 'Hendra']);
    $yudi = User::factory()->create(['name' => 'Yudi']);

    foreach (range(1, 3) as $i) {
        Booking::factory()->approved()->create(['requested_id' => $andi->id, 'start_time' => now()]);
    }

    foreach (range(1, 2) as $i) {
        Booking::factory()->approved()->create(['requested_id' => $hendra->id, 'start_time' => now()]);
    }

    Booking::factory()->approved()->create(['requested_id' => $budi->id, 'start_time' => now()]);
    Booking::factory()->approved()->create(['requested_id' => $yudi->id, 'start_time' => now()]);
    Booking::factory()->rejected()->create(['requested_id' => $yudi->id, 'start_time' => now()]);

    $data = app(DashboardStatistics::class)->monthlyUsers();
    $current = end($data);

    expect($data)->toHaveCount(12)
        ->and(array_keys($current))->toContain('Lainnya')
        ->and($current)->toMatchArray([
            'Andi' => 3,
            'Hendra' => 2,
            'Budi' => 1,
            'Lainnya' => 1,
        ]);
});

test('monthly users split past bookings across earlier months', function () {
    $budi = User::factory()->create(['name' => 'Budi']);

    Booking::factory()->approved()->create([
        'requested_id' => $budi->id,
        'start_time' => now()->subMonth(),
    ]);

    Booking::factory()->approved()->create([
        'requested_id' => $budi->id,
        'start_time' => now(),
    ]);

    $data = app(DashboardStatistics::class)->monthlyUsers();
    $current = end($data);
    $lastMonth = $data[count($data) - 2];

    expect($lastMonth)->toMatchArray(['Budi' => 1, 'Lainnya' => 0])
        ->and($current)->toMatchArray(['Budi' => 1, 'Lainnya' => 0]);
});

test('monthly rooms break down top rooms and the rest per month', function () {
    $rooms = collect(['A', 'B', 'C', 'D'])->map(
        fn (string $name) => Room::factory()->create(['name' => "Ruang {$name}"]),
    );

    Booking::factory()->approved()->create(['room_id' => $rooms[0]->id, 'start_time' => now()]);
    Booking::factory()->approved()->create(['room_id' => $rooms[0]->id, 'start_time' => now()]);
    Booking::factory()->approved()->create(['room_id' => $rooms[1]->id, 'start_time' => now()]);
    Booking::factory()->approved()->create(['room_id' => $rooms[2]->id, 'start_time' => now()]);
    Booking::factory()->approved()->create(['room_id' => $rooms[3]->id, 'start_time' => now()]);
    Booking::factory()->rejected()->create(['room_id' => $rooms[3]->id, 'start_time' => now()]);

    $data = app(DashboardStatistics::class)->monthlyRooms();
    $current = end($data);

    expect($data)->toHaveCount(12)
        ->and($current)->toMatchArray([
            'Ruang A' => 2,
            'Ruang B' => 1,
            'Ruang C' => 1,
            'Lainnya' => 1,
        ]);
});

test('monthly rooms keep a consistent set of keys across every month', function () {
    $room = Room::factory()->create(['name' => 'Ruang Utama']);

    Booking::factory()->approved()->create([
        'room_id' => $room->id,
        'start_time' => now()->subMonths(2),
    ]);

    $data = app(DashboardStatistics::class)->monthlyRooms();

    $firstKeys = array_keys($data[0]);

    collect($data)->each(function (array $month) use ($firstKeys) {
        expect(array_keys($month))->toBe($firstKeys);
    });

    expect($data[0])->toMatchArray(['Ruang Utama' => 0, 'Lainnya' => 0])
        ->and($data[count($data) - 3])->toMatchArray(['Ruang Utama' => 1, 'Lainnya' => 0]);
});
