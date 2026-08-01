<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\Monitoring\MonitoringService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    /**
     * Display the service monitoring page.
     */
    public function __invoke(MonitoringService $monitoring): Response
    {
        return inertia('admin/monitoring', $monitoring->status());
    }

    /**
     * Delete all pending jobs from the queue.
     */
    public function clearQueue(MonitoringService $monitoring): RedirectResponse
    {
        $count = $monitoring->clearPendingJobs();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$count} pending job(s) cleared.",
        ]);

        return back();
    }

    /**
     * Requeue all failed jobs.
     */
    public function retryFailed(MonitoringService $monitoring): RedirectResponse
    {
        $count = $monitoring->retryFailedJobs();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$count} failed job(s) pushed back onto the queue.",
        ]);

        return back();
    }

    /**
     * Delete all failed jobs.
     */
    public function flushFailed(MonitoringService $monitoring): RedirectResponse
    {
        $count = $monitoring->flushFailedJobs();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$count} failed job(s) deleted.",
        ]);

        return back();
    }

    /**
     * Stop all running queue workers.
     */
    public function stopWorker(MonitoringService $monitoring): RedirectResponse
    {
        $monitoring->stopWorker();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Queue worker stop signal sent.',
        ]);

        return back();
    }

    /**
     * Start a detached queue worker.
     */
    public function startWorker(MonitoringService $monitoring): RedirectResponse
    {
        $started = $monitoring->startWorker();

        Inertia::flash('toast', [
            'type' => $started ? 'success' : 'warning',
            'message' => $started
                ? 'Queue worker started.'
                : 'A queue worker is already running.',
        ]);

        return back();
    }

    /**
     * Start the Reverb server.
     */
    public function startReverb(MonitoringService $monitoring): RedirectResponse
    {
        $started = $monitoring->startReverb();

        Inertia::flash('toast', [
            'type' => $started ? 'success' : 'warning',
            'message' => $started
                ? 'Reverb server started.'
                : 'Reverb is already running.',
        ]);

        return back();
    }

    /**
     * Stop the Reverb server.
     */
    public function stopReverb(MonitoringService $monitoring): RedirectResponse
    {
        $stopped = $monitoring->stopReverb();

        Inertia::flash('toast', [
            'type' => $stopped ? 'success' : 'warning',
            'message' => $stopped
                ? 'Reverb server stopped.'
                : 'No Reverb process is being managed.',
        ]);

        return back();
    }
}
