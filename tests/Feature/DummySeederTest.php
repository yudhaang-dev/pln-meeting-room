<?php

use App\Models\Booking;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DummySeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DummySeeder::class);
});

test('dummy seeder assigns an osh level to every booking', function () {
    expect(Booking::count())->toBeGreaterThan(0);
    expect(Booking::whereNull('osh_level_id')->count())->toBe(0);
});

test('dummy seeder assigns a chairperson to every booking', function () {
    expect(Booking::whereNull('chairperson_id')->count())->toBe(0);
});

test('dummy seeder maps osh level from participants count', function () {
    $low = Booking::where('participants_count', '<=', 20)->first();
    $mid = Booking::whereBetween('participants_count', [21, 50])->first();
    $high = Booking::where('participants_count', '>=', 51)->first();

    expect($low)->not->toBeNull();
    expect($mid)->not->toBeNull();
    expect($high)->not->toBeNull();

    expect($low->osh_level?->name)->toBe('Low');
    expect($mid->osh_level?->name)->toBe('Mid');
    expect($high->osh_level?->name)->toBe('High');
});
