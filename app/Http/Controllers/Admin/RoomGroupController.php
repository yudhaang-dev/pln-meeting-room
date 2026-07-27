<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoomGroupRequest;
use App\Http\Requests\Admin\UpdateRoomGroupRequest;
use App\Models\Building;
use App\Models\Room;
use App\Models\RoomGroup;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RoomGroupController extends Controller
{
    public function index(): Response
    {
        $sortBy = request('sort_by', 'name');
        $sortDirection = request('sort_direction', 'asc');
        $allowedSorts = ['name', 'building_id', 'is_active', 'created_at'];

        $roomGroups = RoomGroup::query()
            ->with(['building', 'rooms'])
            ->when(request('search'), fn ($query, $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->when(request('building_id'), fn ($query, $buildingId) => $query->where('building_id', $buildingId))
            ->when(in_array($sortBy, $allowedSorts), fn ($query) => $query->orderBy($sortBy, $sortDirection))
            ->paginate(request('per_page', 10))
            ->withQueryString();

        return Inertia::render('admin/room-groups/index', [
            'roomGroups' => $roomGroups,
            'buildings' => Building::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'rooms' => Room::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreRoomGroupRequest $request): RedirectResponse
    {
        $this->authorize('create', RoomGroup::class);

        $validated = $request->validated();
        $roomIds = $validated['room_ids'] ?? [];
        unset($validated['room_ids']);

        $grouping = RoomGroup::create($validated);
        $grouping->rooms()->sync($roomIds);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Room grouping created.')]);

        return to_route('admin.room-groups.index');
    }

    public function update(UpdateRoomGroupRequest $request, RoomGroup $roomGroup): RedirectResponse
    {
        $this->authorize('update', $roomGroup);

        $validated = $request->validated();
        $roomIds = $validated['room_ids'] ?? [];
        unset($validated['room_ids']);

        $roomGroup->update($validated);
        $roomGroup->rooms()->sync($roomIds);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Room grouping updated.')]);

        return back();
    }

    public function destroy(RoomGroup $roomGroup): RedirectResponse
    {
        $this->authorize('delete', $roomGroup);

        $roomGroup->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Room grouping deleted.')]);

        return back();
    }

    public function media(RoomGroup $roomGroup): Response
    {
        $roomGroup->load(['media' => fn ($q) => $q->orderBy('sort_order')]);

        return Inertia::render('admin/room-groups/media', [
            'roomGroup' => $roomGroup,
        ]);
    }
}
