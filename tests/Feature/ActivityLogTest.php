<?php

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use Illuminate\Support\Facades\DB;

test('successful and failed logins are recorded without the password', function () {
    $user = User::factory()->create(['email' => 'budi@example.com', 'password' => 'rahasia-banget']);

    $this->post('/login', ['email' => 'budi@example.com', 'password' => 'salah-total']);
    $this->post('/login', ['email' => 'tidak-ada@example.com', 'password' => 'apa-saja']);
    $this->post('/login', ['email' => 'budi@example.com', 'password' => 'rahasia-banget']);

    $failed = ActivityLog::where('event', 'auth.failed')->orderBy('id')->get();

    expect($failed)->toHaveCount(2)
        ->and($failed[0]->actor_email)->toBe('budi@example.com')
        ->and($failed[0]->user_id)->toBe($user->id)
        ->and($failed[1]->actor_email)->toBe('tidak-ada@example.com')
        ->and($failed[1]->user_id)->toBeNull()
        ->and(ActivityLog::where('event', 'auth.login')->where('user_id', $user->id)->count())->toBe(1)
        ->and(json_encode(ActivityLog::all()->toArray()))->not->toContain('rahasia-banget')->not->toContain('salah-total');
});

test('booking approval, rejection and edits by a logged in user are recorded with the actor and ip', function () {
    $operator = User::factory()->create(['role' => 'operator']);
    $room = Room::factory()->create();
    $booking = Booking::factory()->create(['room_id' => $room->id, 'status' => 'pending', 'title' => 'Rapat Uji']);

    $this->actingAs($operator)->post(route('bookings.approve', $booking));

    $log = ActivityLog::where('event', 'booking.approved')->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($operator->id)
        ->and($log->description)->toBe('Menyetujui booking "Rapat Uji"')
        ->and($log->ip_address)->not->toBeNull()
        ->and($log->properties['changes']['status'])->toBe(['pending', 'approved']);
});

test('changes made without a logged in user such as seeders are not logged', function () {
    Booking::factory()->create();

    expect(ActivityLog::count())->toBe(0);
});

test('only admins can see the activity page', function () {
    $this->actingAs(User::factory()->create(['role' => 'operator']))
        ->get(route('admin.activity'))->assertForbidden();

    $this->actingAs(User::factory()->create(['role' => 'user']))
        ->get(route('admin.activity'))->assertForbidden();
});

test('admin sees logs, filters by category and the list of online users with their ip', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $online = User::factory()->create(['name' => 'Siti Online']);
    $stale = User::factory()->create(['name' => 'Budi Lama']);

    DB::table('sessions')->insert([
        ['id' => 's1', 'user_id' => $online->id, 'ip_address' => '192.168.1.50', 'user_agent' => 'Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537', 'payload' => '', 'last_activity' => now()->subMinute()->getTimestamp()],
        ['id' => 's2', 'user_id' => $stale->id, 'ip_address' => '192.168.1.60', 'user_agent' => 'x', 'payload' => '', 'last_activity' => now()->subHour()->getTimestamp()],
    ]);

    ActivityLog::create(['event' => 'auth.failed', 'description' => 'Percobaan login gagal', 'actor_email' => 'x@y.z', 'ip_address' => '10.0.0.9']);
    ActivityLog::create(['event' => 'booking.created', 'description' => 'Menambah booking "A"', 'user_id' => $online->id, 'ip_address' => '10.0.0.8']);

    $this->actingAs($admin)->get(route('admin.activity'))->assertInertia(function ($page) {
        $props = $page->toArray()['props'];

        expect($props['online'])->toHaveCount(1)
            ->and($props['online'][0]['name'])->toBe('Siti Online')
            ->and($props['online'][0]['ips'])->toBe(['192.168.1.50'])
            ->and($props['online'][0]['browser'])->toBe('Chrome · Windows')
            ->and($props['summary']['online'])->toBe(1)
            ->and($props['summary']['failed_24h'])->toBe(1)
            ->and($props['logs']['total'])->toBe(2);
    });

    $this->get(route('admin.activity', ['status' => 'failed']))->assertInertia(function ($page) {
        expect($page->toArray()['props']['logs']['total'])->toBe(1);
    });

    $this->get(route('admin.activity', ['search' => '10.0.0.8']))->assertInertia(function ($page) {
        expect($page->toArray()['props']['logs']['data'][0]['description'])->toBe('Menambah booking "A"');
    });
});
