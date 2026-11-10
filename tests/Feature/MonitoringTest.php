<?php

use App\Jobs\WorkerHeartbeat;
use App\Models\User;
use App\Services\Monitoring\MonitoringService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->operator = User::factory()->create(['role' => 'operator']);
    $this->user = User::factory()->create(['role' => 'user']);
});

test('admin can view the monitoring page with queue and reverb status', function () {
    Queue::fake();

    Http::fake([
        '*/up' => Http::response(['health' => 'OK']),
        '*connections*' => Http::response(['connections' => 3]),
    ]);

    Cache::put(MonitoringService::WORKER_HEARTBEAT_KEY, now()->getTimestamp(), 180);

    $this->actingAs($this->admin)
        ->get(route('admin.monitoring'))
        ->assertOk()
        ->assertInertia(function ($page) {
            $page->component('admin/monitoring')
                ->where('queue.worker.alive', true)
                ->where('queue.pending_jobs', 0)
                ->where('queue.failed_jobs', 0)
                ->where('reverb.up', true)
                ->where('reverb.connected_clients', 3)
                ->has('reverb.uptime_seconds')
                ->has('checked_at');
        });

    Queue::assertPushed(WorkerHeartbeat::class);
});

test('monitoring page reports reverb as down when the server is unreachable', function () {
    Queue::fake();

    Http::fake(['*' => Http::response([], 500)]);

    $this->actingAs($this->admin)
        ->get(route('admin.monitoring'))
        ->assertOk()
        ->assertInertia(function ($page) {
            $page->where('reverb.up', false)
                ->where('reverb.connected_clients', null)
                ->where('reverb.uptime_seconds', null);
        });
});

test('monitoring page reports the worker as down when the heartbeat is stale', function () {
    Queue::fake();

    Http::fake(['*' => Http::response([], 500)]);

    Cache::put(MonitoringService::WORKER_HEARTBEAT_KEY, now()->subMinutes(10)->getTimestamp(), 180);

    $this->actingAs($this->admin)
        ->get(route('admin.monitoring'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('queue.worker.alive', false));
});

test('operator cannot access the monitoring page', function () {
    $this->actingAs($this->operator)
        ->get(route('admin.monitoring'))
        ->assertForbidden();
});

test('regular user cannot access the monitoring page', function () {
    $this->actingAs($this->user)
        ->get(route('admin.monitoring'))
        ->assertForbidden();
});

test('monitoring service seeds the worker heartbeat when no chain exists', function () {
    Queue::fake();

    app(MonitoringService::class)->ensureWorkerHeartbeat();

    Queue::assertPushed(WorkerHeartbeat::class);
    expect(Cache::has(MonitoringService::WORKER_HEARTBEAT_SEED_KEY))->toBeTrue();
});

test('monitoring service does not reseed an existing worker heartbeat chain', function () {
    Queue::fake();

    Cache::put(MonitoringService::WORKER_HEARTBEAT_SEED_KEY, true, 300);

    app(MonitoringService::class)->ensureWorkerHeartbeat();

    Queue::assertNotPushed(WorkerHeartbeat::class);
});

test('worker heartbeat job records a heartbeat and reschedules itself', function () {
    Queue::fake();

    (new WorkerHeartbeat)->handle();

    expect(Cache::get(MonitoringService::WORKER_HEARTBEAT_KEY))->toBeInt();
    Queue::assertPushed(WorkerHeartbeat::class);
});

test('worker heartbeat jobs do not reschedule duplicates within the scheduling window', function () {
    Queue::fake();

    (new WorkerHeartbeat)->handle();
    (new WorkerHeartbeat)->handle();

    Queue::assertPushed(WorkerHeartbeat::class, 1);
});

test('monitoring page includes server health checks', function () {
    $admin = App\Models\User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->get(route('admin.monitoring'))->assertInertia(fn ($page) => $page
        ->has('health.overall')
        ->has('health.checks', 6)
        ->where('health.checks.0.key', 'database')
        ->where('health.checks.0.status', 'ok'));
});

test('clearing cache is admin only and logged', function () {
    $operator = App\Models\User::factory()->create(['role' => 'operator']);
    $admin = App\Models\User::factory()->create(['role' => 'admin']);

    $this->actingAs($operator)->post(route('admin.actions.clearCache'))->assertForbidden();

    $this->actingAs($admin)->post(route('admin.actions.clearCache'))->assertRedirect();
    expect(App\Models\ActivityLog::where('event', 'system.clear_cache')->where('user_id', $admin->id)->count())->toBe(1);
});

test('clearing cache never removes the restart signals that queue worker and reverb watch', function () {
    // Worker dan Reverb berhenti sendiri bila nilai tanda ini berubah, termasuk saat hilang.
    Illuminate\Support\Facades\Cache::forever('illuminate:queue:restart', 111);
    Illuminate\Support\Facades\Cache::forever('laravel:reverb:restart', 222);
    Illuminate\Support\Facades\Cache::put('data-lain', 'x', 600);

    $this->actingAs(App\Models\User::factory()->create(['role' => 'admin']))
        ->post(route('admin.actions.clearCache'))->assertRedirect();

    expect(Illuminate\Support\Facades\Cache::get('illuminate:queue:restart'))->toBe(111)
        ->and(Illuminate\Support\Facades\Cache::get('laravel:reverb:restart'))->toBe(222)
        ->and(Illuminate\Support\Facades\Cache::get('data-lain'))->toBe('x');
});

test('dangerous admin actions require password confirmation', function () {
    $admin = App\Models\User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('admin.actions.logoutAll'))->assertRedirect(route('password.confirm'));
    $this->get(route('admin.exportDatabase'))->assertRedirect(route('password.confirm'));
});

test('logging out everyone removes other sessions but keeps the admin session', function () {
    $admin = App\Models\User::factory()->create(['role' => 'admin']);
    $other = App\Models\User::factory()->create(['role' => 'user', 'remember_token' => 'lama']);

    Illuminate\Support\Facades\DB::table('sessions')->insert([
        'id' => 'sesi-user', 'user_id' => $other->id, 'ip_address' => '10.0.0.5', 'user_agent' => 'x', 'payload' => '', 'last_activity' => time(),
    ]);

    $this->actingAs($admin)->withSession(['auth.password_confirmed_at' => time()])
        ->post(route('admin.actions.logoutAll'))->assertRedirect();

    expect(Illuminate\Support\Facades\DB::table('sessions')->where('id', 'sesi-user')->exists())->toBeFalse()
        ->and($other->fresh()->remember_token)->not->toBe('lama')
        ->and(App\Models\ActivityLog::where('event', 'system.logout_all')->count())->toBe(1);
});

test('database export downloads sql without sessions and is logged', function () {
    $admin = App\Models\User::factory()->create(['role' => 'admin', 'email' => 'eksport@contoh.test']);

    Illuminate\Support\Facades\DB::table('sessions')->insert([
        'id' => 'rahasia-sesi-123', 'user_id' => $admin->id, 'ip_address' => '10.0.0.5', 'user_agent' => 'x', 'payload' => '', 'last_activity' => time(),
    ]);

    $response = $this->actingAs($admin)->withSession(['auth.password_confirmed_at' => time()])
        ->get(route('admin.exportDatabase'));

    $response->assertOk();
    $sql = $response->streamedContent();

    expect($response->headers->get('content-disposition'))->toContain('jadwal-rapat-')->toContain('.sql')
        ->and($sql)->toContain('CREATE TABLE')->toContain('INSERT INTO `users`')->toContain('eksport@contoh.test')
        ->and($sql)->not->toContain('rahasia-sesi-123')->not->toContain('CREATE TABLE "sessions"')
        ->and(App\Models\ActivityLog::where('event', 'system.export_database')->count())->toBe(1);
});
