<?php

namespace App\Http\Controllers;

use App\Models\Building;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $building = Building::query()
            ->with([
                'rooms' => fn ($query) => $query->where('is_active', true),
                'rooms.building',
                'roomGroups' => fn ($query) => $query->where('is_active', true),
                'roomGroups.building',
            ])
            ->whereHas('rooms', function (Builder $query) {
                $query->where('is_active', true);
            })
            ->whereHas('roomGroups', function (Builder $query) {
                $query->where('is_active', true);
            });

        $buildings = $building->get();

        return Inertia::render('home', [
            'buildings' => $buildings,
        ]);
    }
}
