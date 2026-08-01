<?php

namespace App\Services\Monitoring;

use App\Jobs\WorkerHeartbeat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class MonitoringService
{
    public const WORKER_HEARTBEAT_KEY = 'queue.worker.heartbeat';

    public const WORKER_HEARTBEAT_TOKEN_KEY = 'queue.worker.heartbeat.token';

    public const REVERB_UP_SINCE_KEY = 'reverb.up_since';

    public const REVERB_PID_KEY = 'reverb.process.pid';

    /**
     * The number of seconds after which a missing heartbeat marks the worker as down.
     */
    protected const WORKER_HEARTBEAT_TOLERANCE = 120;

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
        if (Cache::has(self::WORKER_HEARTBEAT_TOKEN_KEY)) {
            return;
        }

        $job = new WorkerHeartbeat((string) Str::uuid());

        Cache::put(self::WORKER_HEARTBEAT_TOKEN_KEY, $job->token, 300);

        dispatch($job);
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
            'running' => $this->reverbProcessIsRunning(),
            'pid' => (int) Cache::get(self::REVERB_PID_KEY, 0),
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

    /**
     * Delete all pending jobs from the queue.
     */
    public function clearPendingJobs(): int
    {
        return (int) DB::table('jobs')->delete();
    }

    /**
     * Requeue all failed jobs and return the number of jobs retried.
     */
    public function retryFailedJobs(): int
    {
        $count = (int) DB::table('failed_jobs')->count();

        if ($count > 0) {
            Artisan::call('queue:retry', ['id' => ['all']]);
        }

        return $count;
    }

    /**
     * Delete all failed jobs.
     */
    public function flushFailedJobs(): int
    {
        return (int) DB::table('failed_jobs')->delete();
    }

    /**
     * Signal all running queue workers to stop gracefully.
     */
    public function stopWorker(): void
    {
        Artisan::call('queue:restart');
    }

    /**
     * Start a detached queue worker process.
     */
    public function startWorker(): bool
    {
        if ($this->workerIsAlive()) {
            return false;
        }

        $this->spawnWorkerProcess();

        $this->ensureWorkerHeartbeat();

        return true;
    }

    /**
     * Spawn a detached queue worker process.
     */
    protected function spawnWorkerProcess(): void
    {
        $command = escapeshellarg(PHP_BINARY).' artisan queue:work --tries=1 --timeout=0';

        if (PHP_OS_FAMILY === 'Windows') {
            $handle = popen(
                'powershell -NoProfile -Command "Start-Process -FilePath '.escapeshellarg(PHP_BINARY).' -WorkingDirectory '.escapeshellarg(base_path()).' -ArgumentList \'artisan\',\'queue:work\',\'--tries=1\',\'--timeout=0\' -WindowStyle Hidden"',
                'r'
            );
        } else {
            exec('nohup '.$command.' > /dev/null 2>&1 &');
        }

        if (isset($handle) && is_resource($handle)) {
            pclose($handle);
        }
    }

    /**
     * Determine whether the tracked Reverb process is still running.
     */
    public function reverbProcessIsRunning(): bool
    {
        $pid = (int) Cache::get(self::REVERB_PID_KEY, 0);

        if ($pid <= 0) {
            return false;
        }

        if (! $this->processIsAlive($pid)) {
            Cache::forget(self::REVERB_PID_KEY);

            return false;
        }

        return true;
    }

    /**
     * Start a detached Reverb server process.
     */
    public function startReverb(): bool
    {
        if ($this->reverbProcessIsRunning()) {
            return false;
        }

        if ($this->reverbIsUp($this->reverbBaseUrl())) {
            return false;
        }

        $pid = $this->spawnReverbProcess();

        if ($pid <= 0) {
            return false;
        }

        Cache::forever(self::REVERB_PID_KEY, $pid);

        return true;
    }

    /**
     * Stop the tracked Reverb server process.
     */
    public function stopReverb(): bool
    {
        $pid = (int) Cache::get(self::REVERB_PID_KEY, 0);

        if ($pid <= 0 || ! $this->processIsAlive($pid)) {
            Cache::forget(self::REVERB_PID_KEY);

            return false;
        }

        $this->killProcess($pid);

        Cache::forget(self::REVERB_PID_KEY);
        Cache::forget(self::REVERB_UP_SINCE_KEY);

        return true;
    }

    /**
     * Spawn a detached Reverb server process and return its PID.
     */
    protected function spawnReverbProcess(): int
    {
        if (PHP_OS_FAMILY === 'Windows') {
            $handle = popen(
                'powershell -NoProfile -Command "(Start-Process -FilePath '.escapeshellarg(PHP_BINARY).' -WorkingDirectory '.escapeshellarg(base_path()).' -ArgumentList \'artisan\',\'reverb:start\' -WindowStyle Hidden -PassThru).Id"',
                'r'
            );

            $output = $handle !== false ? stream_get_contents($handle) : false;

            if (is_resource($handle)) {
                pclose($handle);
            }

            return (int) trim((string) $output);
        }

        exec('nohup '.escapeshellarg(PHP_BINARY).' artisan reverb:start > /dev/null 2>&1 & echo $!', $output);

        return (int) ($output[0] ?? 0);
    }

    /**
     * Determine whether a process is still alive by its PID.
     */
    protected function processIsAlive(int $pid): bool
    {
        if (PHP_OS_FAMILY === 'Windows') {
            exec('tasklist /FI "PID eq '.$pid.'" /NH', $output);

            return str_contains(implode(' ', $output), (string) $pid);
        }

        if (function_exists('posix_kill')) {
            return @posix_kill($pid, 0);
        }

        return false;
    }

    /**
     * Terminate a process by its PID.
     */
    protected function killProcess(int $pid): void
    {
        if (PHP_OS_FAMILY === 'Windows') {
            exec('taskkill /F /PID '.$pid);
        } elseif (function_exists('posix_kill')) {
            @posix_kill($pid, SIGTERM);
        }
    }
}
