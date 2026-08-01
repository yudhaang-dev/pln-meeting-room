<?php

namespace App\Jobs;

use App\Services\Monitoring\MonitoringService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class WorkerHeartbeat implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public string $token)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Cache::put(MonitoringService::WORKER_HEARTBEAT_KEY, now()->getTimestamp(), 180);

        if (Cache::get(MonitoringService::WORKER_HEARTBEAT_TOKEN_KEY) !== $this->token) {
            return;
        }

        $next = new self((string) Str::uuid());

        Cache::put(MonitoringService::WORKER_HEARTBEAT_TOKEN_KEY, $next->token, 300);

        dispatch($next)->delay(now()->addSeconds(60));
    }
}
