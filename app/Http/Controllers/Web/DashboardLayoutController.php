<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\DashboardLayout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DashboardLayoutController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'order' => ['required', 'array', 'max:'.count(DashboardLayout::WIDGETS)],
            'order.*' => ['string', Rule::in(DashboardLayout::WIDGETS), 'distinct'],
            'hidden' => ['present', 'array', 'max:'.count(DashboardLayout::WIDGETS)],
            'hidden.*' => ['string', Rule::in(DashboardLayout::WIDGETS), 'distinct'],
        ]);

        DashboardLayout::save($request->user(), DashboardLayout::normalize($validated['order'], $validated['hidden']));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tampilan dashboard disimpan.']);

        return back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        DashboardLayout::save($request->user(), null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tampilan dashboard dikembalikan ke bawaan.']);

        return back();
    }
}
