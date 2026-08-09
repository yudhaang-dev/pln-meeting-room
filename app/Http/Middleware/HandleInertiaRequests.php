<?php

namespace App\Http\Middleware;

use App\Settings\GeneralSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $notificationSound = $user?->notification_audio_url;

        if (! $notificationSound) {
            $defaultAudio = app(GeneralSettings::class)->audio_notification;

            $notificationSound = $defaultAudio ? Storage::disk('public')->url($defaultAudio) : null;
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'unreadNotifications' => $user?->unreadNotifications()->get() ?? [],
            ],
            'notificationSound' => $notificationSound,
            'pending_count' => fn () => $request->session()->get('pending_count'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            '_token' => csrf_token(),
        ];
    }
}
