<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Services\Monitoring\ServiceManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceControlController extends Controller
{
    public function start(Request $request, ServiceManager $manager, string $service): RedirectResponse
    {
        return $this->run($request, $service, 'start', $manager->start($service));
    }

    public function restart(Request $request, ServiceManager $manager, string $service): RedirectResponse
    {
        return $this->run($request, $service, 'restart', $manager->restart($service));
    }

    /**
     * @param  array{ok: bool, message: string}  $result
     */
    private function run(Request $request, string $service, string $action, array $result): RedirectResponse
    {
        ActivityLogger::record(
            event: "system.service_{$action}",
            description: ($action === 'start' ? 'Menjalankan' : 'Merestart').' layanan '.($service === 'queue' ? 'pekerja latar belakang' : 'server WebSocket').($result['ok'] ? '' : ' (gagal)'),
            userId: $request->user()->id,
            actorEmail: $request->user()->email,
        );

        Inertia::flash('toast', ['type' => $result['ok'] ? 'success' : 'error', 'message' => $result['message']]);

        return back();
    }
}
