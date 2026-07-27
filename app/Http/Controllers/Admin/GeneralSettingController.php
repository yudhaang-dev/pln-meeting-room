<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGeneralSettingRequest;
use App\Settings\GeneralSettings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GeneralSettingController extends Controller
{
    public function edit(): Response
    {
        $settings = app(GeneralSettings::class);

        return Inertia::render('admin/settings', [
            'settings' => $settings->toArray(),
        ]);
    }

    public function update(UpdateGeneralSettingRequest $request): RedirectResponse
    {
        $settings = app(GeneralSettings::class);
        $validated = $request->validated();

        $settings->fill($validated)->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings updated.')]);

        return to_route('admin.settings.edit');
    }
}
