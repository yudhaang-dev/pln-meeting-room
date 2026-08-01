<?php

namespace App\Http\Controllers\Web;

use App\Events\PublicBroadcast;
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
        $this->authorize('viewAny', RoomGroup::class);

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

        return inertia('room-groups/index', [
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

        $roomGroup = RoomGroup::create($validated);
        $roomGroup->rooms()->sync($roomIds);

        PublicBroadcast::dispatch('Display.Room.'.$roomGroup->id, 'RoomGroupCreated', $roomGroup->toArray());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Room group created.')]);

        return to_route('room-groups.index');
    }

    public function update(UpdateRoomGroupRequest $request, RoomGroup $roomGroup): RedirectResponse
    {
        $this->authorize('update', $roomGroup);

        $validated = $request->validated();
        $roomIds = $validated['room_ids'] ?? [];
        unset($validated['room_ids']);

        $roomGroup->update($validated);
        $roomGroup->rooms()->sync($roomIds);

        PublicBroadcast::dispatch('Display.RoomGroup.'.$roomGroup->id, 'RoomGroupUpdated', $roomGroup->toArray());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Room group updated.')]);

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
        $this->authorize('view', $roomGroup);

        $roomGroup->load(['media' => fn ($q) => $q->orderBy('sort_order')]);

        return inertia('room-groups/media', [
            'roomGroup' => $roomGroup,
        ]);
    }
}
