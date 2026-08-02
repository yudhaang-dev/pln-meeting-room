<?php

namespace App\Services\Monitoring;

use App\Jobs\WorkerHeartbeat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class MonitoringService
{
    public const WORKER_HEARTBEAT_KEY = 'queue.worker.heartbeat';

    public const WORKER_HEARTBEAT_SCHEDULED_KEY = 'queue.worker.heartbeat.scheduled';

    public const WORKER_HEARTBEAT_SEED_KEY = 'queue.worker.heartbeat.seed';

    public const REVERB_UP_SINCE_KEY = 'reverb.up_since';

    /**
     * The number of seconds after which a missing heartbeat marks the worker as down.
     */
    protected const WORKER_HEARTBEAT_TOLERANCE = 90;

    /**
     * The delay between heartbeat jobs while a worker is running.
     */
    public const WORKER_HEARTBEAT_INTERVAL = 60;

    /**
     * Gather the current status of the queue and Reverb services.
     *
     * @return array<string, mixed>
     */
    public function status(): array
    {
        $this->ensureWorkerHeartbeat();

        return [
            'queue' => $this->queueStatus(),
            'reverb' => $this->reverbStatus(),
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Gather the queue worker status.
     *
     * @return array<string, mixed>
     */
    public function queueStatus(): array
    {
        return [
            'driver' => config('queue.default'),
            'pending_jobs' => (int) DB::table('jobs')->count(),
            'failed_jobs' => (int) DB::table('failed_jobs')->count(),
            'worker' => [
                'alive' => $this->workerIsAlive(),
                'last_heartbeat_at' => $this->lastWorkerHeartbeat(),
            ],
        ];
    }

    /**
     * Determine whether the queue worker is alive based on the last heartbeat.
     */
    public function workerIsAlive(): bool
    {
        $heartbeat = (int) Cache::get(self::WORKER_HEARTBEAT_KEY, 0);

        return $heartbeat > 0 && now()->getTimestamp() - $heartbeat < self::WORKER_HEARTBEAT_TOLERANCE;
    }

    /**
     * Get the ISO timestamp of the last worker heartbeat.
     */
    protected function lastWorkerHeartbeat(): ?string
    {
        $heartbeat = (int) Cache::get(self::WORKER_HEARTBEAT_KEY, 0);

        return $heartbeat > 0 ? Carbon::createFromTimestamp($heartbeat)->toIso8601String() : null;
    }

    /**
     * Seed the self-perpetuating worker heartbeat when the chain has expired.
     */
    public function ensureWorkerHeartbeat(): void
    {
        if (Cache::add(self::WORKER_HEARTBEAT_SEED_KEY, true, 300)) {
            dispatch(new WorkerHeartbeat);
        }
    }

    /**
     * Gather the Reverb server status.
     *
     * @return array<string, mixed>
     */
    public function reverbStatus(): array
    {
        $baseUrl = $this->reverbBaseUrl();

        $up = $this->reverbIsUp($baseUrl);
        $connections = $up ? $this->connectedClients($baseUrl, $this->reverbConfig()['app_id']) : null;

        if ($up && ! Cache::has(self::REVERB_UP_SINCE_KEY)) {
            Cache::forever(self::REVERB_UP_SINCE_KEY, now()->getTimestamp());
        }

        if (! $up) {
            Cache::forget(self::REVERB_UP_SINCE_KEY);
        }

        $upSince = (int) Cache::get(self::REVERB_UP_SINCE_KEY, 0);

        return [
            'up' => $up,
            'url' => $baseUrl,
            'connected_clients' => $connections,
            'uptime_seconds' => $upSince > 0 ? now()->getTimestamp() - $upSince : null,
            'up_since' => $upSince > 0 ? Carbon::createFromTimestamp($upSince)->toIso8601String() : null,
        ];
    }

    /**
     * Build the base URL of the Reverb server.
     */
    protected function reverbBaseUrl(): string
    {
        $config = $this->reverbConfig();

        return "{$config['scheme']}://{$config['host']}:{$config['port']}";
    }

    /**
     * Probe the Reverb health check endpoint.
     */
    protected function reverbIsUp(string $baseUrl): bool
    {
        try {
            return Http::connectTimeout(2)->timeout(2)->get("{$baseUrl}/up")->ok();
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * Fetch the number of clients connected to the Reverb server.
     */
    protected function connectedClients(string $baseUrl, string $appId): ?int
    {
        try {
            $response = Http::connectTimeout(2)->timeout(2)->get($this->signedConnectionsUrl($baseUrl, $appId));

            if (! $response->ok()) {
                return null;
            }

            return (int) $response->json('connections');
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Build the signed URL for the Pusher connections endpoint.
     */
    protected function signedConnectionsUrl(string $baseUrl, string $appId): string
    {
        $config = $this->reverbConfig();
        $path = "/apps/{$appId}/connections";

        $params = [
            'auth_key' => $config['key'],
            'auth_timestamp' => time(),
            'auth_version' => '1.0',
        ];

        ksort($params);

        $query = collect($params)->map(fn ($value, string $key) => "{$key}={$value}")->implode('&');

        $signature = hash_hmac('sha256', "GET\n{$path}\n{$query}", $config['secret']);

        return "{$baseUrl}{$path}?{$query}&auth_signature={$signature}";
    }

    /**
     * @return array{host: string, port: int, scheme: string, app_id: string, key: string, secret: string}
     */
    protected function reverbConfig(): array
    {
        $app = config('reverb.apps.apps')[0];

        return [
            'host' => (string) ($app['options']['host'] ?? config('reverb.servers.reverb.hostname', 'localhost')),
            'port' => (int) ($app['options']['port'] ?? config('reverb.servers.reverb.port', 8080)),
            'scheme' => (string) ($app['options']['scheme'] ?? 'http'),
            'app_id' => (string) ($app['app_id'] ?? ''),
            'key' => (string) ($app['key'] ?? ''),
            'secret' => (string) ($app['secret'] ?? ''),
        ];
    }
}
