<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\Monitoring\MonitoringService;
use App\Services\Monitoring\ServerHealth;
use App\Services\Monitoring\ServiceManager;
use Inertia\Response;

class MonitoringController extends Controller
{
    /**
     * Display the service monitoring page.
     */
    public function __invoke(MonitoringService $monitoring, ServerHealth $health, ServiceManager $manager): Response
    {
        return inertia('admin/monitoring', [
            ...$monitoring->status(),
            'health' => $health->check(),
            'controls' => ['php_cli' => $manager->phpCli()],
        ]);
    }
}
