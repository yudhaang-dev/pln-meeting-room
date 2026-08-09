<?php

namespace App\Http\Controllers\Web\Settings;

use App\Events\PublicBroadcast;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGeneralSettingRequest;
use App\Settings\GeneralSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GeneralController extends Controller
{
    public function edit(): Response
    {
        $settings = app(GeneralSettings::class);

        $data = $settings->toArray();
        $data['audio_url'] = $settings->audio_notification
            ? Storage::disk('public')->url($settings->audio_notification)
            : null;

        return Inertia::render('settings/systems/general', [
            'settings' => $data,
        ]);
    }

    public function update(UpdateGeneralSettingRequest $request): RedirectResponse
    {
        $settings = app(GeneralSettings::class);
        $validated = $request->validated();

        $audio = $validated['audio_notification'] ?? null;
        unset($validated['audio_notification']);

        if ($audio instanceof UploadedFile) {
            if ($settings->audio_notification) {
                Storage::disk('public')->delete($settings->audio_notification);
            }

            $validated['audio_notification'] = $audio->store('audio/settings', 'public');
        }

        $settings->fill($validated)->save();

        PublicBroadcast::dispatch('Display.Global', 'SettingsUpdated', []);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings updated.')]);

        return to_route('settings.systems.general.edit');
    }
}
