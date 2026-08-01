<?php

use App\Jobs\WorkerHeartbeat;
use App\Models\User;
use App\Services\Monitoring\MonitoringService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

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
    expect(Cache::has(MonitoringService::WORKER_HEARTBEAT_TOKEN_KEY))->toBeTrue();
});

test('monitoring service does not reseed an existing worker heartbeat chain', function () {
    Queue::fake();

    Cache::put(MonitoringService::WORKER_HEARTBEAT_TOKEN_KEY, 'existing', 300);

    app(MonitoringService::class)->ensureWorkerHeartbeat();

    Queue::assertNotPushed(WorkerHeartbeat::class);
});

test('worker heartbeat job records a heartbeat and reschedules itself', function () {
    Queue::fake();

    $token = (string) Str::uuid();

    Cache::put(MonitoringService::WORKER_HEARTBEAT_TOKEN_KEY, $token, 300);

    (new WorkerHeartbeat($token))->handle();

    expect(Cache::get(MonitoringService::WORKER_HEARTBEAT_KEY))->toBeInt();
    Queue::assertPushed(WorkerHeartbeat::class);
});

test('stale worker heartbeat jobs do not reschedule themselves', function () {
    Queue::fake();

    Cache::put(MonitoringService::WORKER_HEARTBEAT_TOKEN_KEY, 'current-token', 300);

    (new WorkerHeartbeat('stale-token'))->handle();

    expect(Cache::get(MonitoringService::WORKER_HEARTBEAT_KEY))->toBeInt();
    Queue::assertNotPushed(WorkerHeartbeat::class);
});

test('admin can clear pending queue jobs', function () {
    $this->actingAs($this->admin);

    DB::table('jobs')->insert([
        'queue' => 'default',
        'payload' => '{}',
        'attempts' => 0,
        'available_at' => now()->getTimestamp(),
        'created_at' => now()->getTimestamp(),
    ]);

    $this->post(route('admin.monitoring.queue.clear'))->assertRedirect();

    expect(DB::table('jobs')->count())->toBe(0);
});

test('admin can retry all failed jobs', function () {
    $this->actingAs($this->admin);

    DB::table('failed_jobs')->insert([
        'uuid' => (string) Str::uuid(),
        'connection' => 'database',
        'queue' => 'default',
        'payload' => json_encode([
            'displayName' => 'App\\Jobs\\WorkerHeartbeat',
            'job' => 'Illuminate\\Queue\\CallQueuedHandler@call',
            'maxTries' => 1,
            'timeout' => null,
            'data' => [],
        ]),
        'exception' => 'Test exception',
        'failed_at' => now(),
    ]);

    $this->post(route('admin.monitoring.failed.retry'))->assertRedirect();

    expect(DB::table('failed_jobs')->count())->toBe(0);
    expect(DB::table('jobs')->count())->toBe(1);
});

test('admin can flush all failed jobs', function () {
    $this->actingAs($this->admin);

    DB::table('failed_jobs')->insert([
        'uuid' => (string) Str::uuid(),
        'connection' => 'database',
        'queue' => 'default',
        'payload' => '{}',
        'exception' => 'Test exception',
        'failed_at' => now(),
    ]);

    $this->post(route('admin.monitoring.failed.clear'))->assertRedirect();

    expect(DB::table('failed_jobs')->count())->toBe(0);
});

test('admin can send a stop signal to the queue worker', function () {
    $this->actingAs($this->admin);

    $before = Cache::get('illuminate:queue:restart');

    $this->post(route('admin.monitoring.worker.stop'))->assertRedirect();

    $after = Cache::get('illuminate:queue:restart');

    expect($after)->not->toBe($before);
});

test('admin can start a detached queue worker when no worker is running', function () {
    Queue::fake();

    $service = Mockery::mock(MonitoringService::class)
        ->makePartial()
        ->shouldAllowMockingProtectedMethods();
    $service->shouldReceive('spawnWorkerProcess')->once();
    $this->app->instance(MonitoringService::class, $service);

    $this->actingAs($this->admin)
        ->post(route('admin.monitoring.worker.start'))
        ->assertRedirect();

    Queue::assertPushed(WorkerHeartbeat::class);
});

test('admin can start reverb when no reverb process is managed', function () {
    $service = Mockery::mock(MonitoringService::class)
        ->makePartial()
        ->shouldAllowMockingProtectedMethods();
    $service->shouldReceive('reverbProcessIsRunning')->andReturn(false);
    $service->shouldReceive('reverbIsUp')->andReturn(false);
    $service->shouldReceive('spawnReverbProcess')->andReturn(54321);
    $this->app->instance(MonitoringService::class, $service);

    $this->actingAs($this->admin)
        ->post(route('admin.monitoring.reverb.start'))
        ->assertRedirect();

    expect(Cache::get(MonitoringService::REVERB_PID_KEY))->toBe(54321);
});

test('admin can stop a managed reverb process', function () {
    Cache::forever(MonitoringService::REVERB_PID_KEY, 54321);

    $service = Mockery::mock(MonitoringService::class)
        ->makePartial()
        ->shouldAllowMockingProtectedMethods();
    $service->shouldReceive('processIsAlive')->with(54321)->andReturn(true);
    $service->shouldReceive('killProcess')->once()->with(54321);
    $this->app->instance(MonitoringService::class, $service);

    $this->actingAs($this->admin)
        ->post(route('admin.monitoring.reverb.stop'))
        ->assertRedirect();

    expect(Cache::has(MonitoringService::REVERB_PID_KEY))->toBeFalse();
});

test('monitoring actions are forbidden for non-admin users', function () {
    $this->actingAs($this->operator);

    $this->post(route('admin.monitoring.queue.clear'))->assertForbidden();
    $this->post(route('admin.monitoring.failed.retry'))->assertForbidden();
    $this->post(route('admin.monitoring.failed.clear'))->assertForbidden();
    $this->post(route('admin.monitoring.worker.stop'))->assertForbidden();
    $this->post(route('admin.monitoring.worker.start'))->assertForbidden();
    $this->post(route('admin.monitoring.reverb.start'))->assertForbidden();
    $this->post(route('admin.monitoring.reverb.stop'))->assertForbidden();
});
