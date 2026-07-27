<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoomRequest;
use App\Http\Requests\Admin\UpdateRoomRequest;
use App\Models\Building;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RoomController extends Controller
{
    public function index(): Response
    {
        $sortBy = request('sort_by', 'name');
        $sortDirection = request('sort_direction', 'asc');
        $allowedSorts = ['name', 'capacity', 'is_active', 'created_at'];

        $rooms = Room::query()
            ->with('roomGroups')
            ->when(request('search'), fn ($query, $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->when(in_array($sortBy, $allowedSorts), fn ($query) => $query->orderBy($sortBy, $sortDirection))
            ->paginate(request('per_page', 10))
            ->withQueryString();

        return Inertia::render('admin/rooms/index', [
            'rooms' => $rooms,
            'buildings' => Building::where('is_active', true)->get(),
        ]);
    }

    public function store(StoreRoomRequest $request): RedirectResponse
    {
        $this->authorize('create', Room::class);

        Room::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Room created.')]);

        return to_route('admin.rooms.index');
    }

    public function update(UpdateRoomRequest $request, Room $room): RedirectResponse
    {
        $this->authorize('update', $room);

        $room->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Room updated.')]);

        return back();
    }

    public function destroy(Room $room): RedirectResponse
    {
        $this->authorize('delete', $room);

        $room->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Room deleted.')]);

        return back();
    }

    public function media(Room $room): Response
    {
        $room->load(['media' => fn ($q) => $q->orderBy('sort_order')]);

        return Inertia::render('admin/rooms/media', [
            'room' => $room,
        ]);
    }
}
