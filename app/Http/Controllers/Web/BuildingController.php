<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBuildingRequest;
use App\Http\Requests\Admin\UpdateBuildingRequest;
use App\Models\Building;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BuildingController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Building::class);

        $sortBy = request('sort_by', 'name');
        $sortDirection = request('sort_direction', 'asc');
        $allowedSorts = ['name', 'is_active', 'created_at'];

        $buildings = Building::query()
            ->when(request('search'), fn ($query, $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->when(in_array($sortBy, $allowedSorts), fn ($query) => $query->orderBy($sortBy, $sortDirection))
            ->paginate(request('per_page', 10))
            ->withQueryString();

        return inertia('buildings/index', [
            'buildings' => $buildings,
        ]);
    }

    public function store(StoreBuildingRequest $request): RedirectResponse
    {
        return $this->catchErrors(function () use ($request) {
            $this->authorize('create', Building::class);

            Building::create($request->validated());

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Building created.')]);

            return to_route('buildings.index');
        }, __('Failed to create building.'));
    }

    public function update(UpdateBuildingRequest $request, Building $building): RedirectResponse
    {
        return $this->catchErrors(function () use ($request, $building) {
            $this->authorize('update', $building);

            $building->update($request->validated());

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Building updated.')]);

            return back();
        }, __('Failed to update building.'));
    }

    public function destroy(Building $building): RedirectResponse
    {
        return $this->catchErrors(function () use ($building) {
            $this->authorize('delete', $building);

            $building->delete();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Building deleted.')]);

            return back();
        }, __('Failed to delete building.'));
    }
}
