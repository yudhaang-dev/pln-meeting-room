<?php

namespace App\Jobs;

use App\Services\Monitoring\MonitoringService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class WorkerHeartbeat implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Cache::put(MonitoringService::WORKER_HEARTBEAT_KEY, now()->getTimestamp(), 180);

        if (Cache::add(MonitoringService::WORKER_HEARTBEAT_SCHEDULED_KEY, true, MonitoringService::WORKER_HEARTBEAT_INTERVAL)) {
            dispatch(new self)->delay(now()->addSeconds(MonitoringService::WORKER_HEARTBEAT_INTERVAL));
        }
    }
}
