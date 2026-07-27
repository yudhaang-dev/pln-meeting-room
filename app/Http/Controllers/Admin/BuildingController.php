<?php

namespace App\Http\Controllers\Admin;

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
        $sortBy = request('sort_by', 'name');
        $sortDirection = request('sort_direction', 'asc');
        $allowedSorts = ['name', 'is_active', 'created_at'];

        $buildings = Building::query()
            ->when(request('search'), fn ($query, $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->when(in_array($sortBy, $allowedSorts), fn ($query) => $query->orderBy($sortBy, $sortDirection))
            ->paginate(request('per_page', 10))
            ->withQueryString();

        return Inertia::render('admin/buildings/index', [
            'buildings' => $buildings,
        ]);
    }

    public function store(StoreBuildingRequest $request): RedirectResponse
    {
        $this->authorize('create', Building::class);

        Building::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Building created.')]);

        return to_route('admin.buildings.index');
    }

    public function update(UpdateBuildingRequest $request, Building $building): RedirectResponse
    {
        $this->authorize('update', $building);

        $building->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Building updated.')]);

        return back();
    }

    public function destroy(Building $building): RedirectResponse
    {
        $this->authorize('delete', $building);

        $building->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Building deleted.')]);

        return back();
    }
}
