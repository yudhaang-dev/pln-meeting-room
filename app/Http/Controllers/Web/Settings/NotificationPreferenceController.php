<?php

namespace App\Http\Controllers\Web\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateNotificationPreferenceRequest;
use App\Settings\GeneralSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceController extends Controller
{
    public function edit(): Response
    {
        $user = auth()->user();
        $defaultAudio = app(GeneralSettings::class)->audio_notification;

        return Inertia::render('settings/account/notification', [
            'audio_url' => $user->notification_audio_url,
            'audio_name' => $user->notification_audio ? basename($user->notification_audio) : null,
            'default_audio_url' => $defaultAudio ? Storage::disk('public')->url($defaultAudio) : null,
        ]);
    }

    public function update(UpdateNotificationPreferenceRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $audio = $validated['audio_notification'] ?? null;

        if (! empty($validated['remove_audio'])) {
            $user->deleteNotificationAudio();
            $user->save();

            $message = __('Notification audio reset to default.');
        } elseif ($audio instanceof UploadedFile) {
            $user->deleteNotificationAudio();
            $user->fill([
                'notification_audio' => $audio->store('users/notification-audio', 'public'),
            ])->save();

            $message = __('Notification audio updated.');
        } else {
            return to_route('settings.account.notification.edit');
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('settings.account.notification.edit');
    }
}
