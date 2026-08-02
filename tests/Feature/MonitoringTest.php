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
