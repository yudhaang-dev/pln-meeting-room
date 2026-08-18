<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreOshLevelRequest;
use App\Http\Requests\Admin\UpdateOshLevelRequest;
use App\Models\OshLevel;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OshLevelController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', OshLevel::class);

        $sortBy = request('sort_by', 'sort_order');
        $sortDirection = request('sort_direction', 'asc');
        $allowedSorts = ['name', 'color', 'min_participants', 'max_participants', 'sort_order', 'is_active'];

        $oshLevels = OshLevel::query()
            ->when(request('search'), fn ($query, $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->when(in_array($sortBy, $allowedSorts), fn ($query) => $query->orderBy($sortBy, $sortDirection))
            ->orderBy('sort_order')
            ->paginate(request('per_page', 10))
            ->withQueryString();

        return inertia('osh-levels/index', [
            'oshLevels' => $oshLevels,
        ]);
    }

    public function store(StoreOshLevelRequest $request): RedirectResponse
    {
        return $this->catchErrors(function () use ($request) {
            $this->authorize('create', OshLevel::class);

            OshLevel::create($request->validated());

            Inertia::flash('toast', ['type' => 'success', 'message' => __('OSH level created.')]);

            return to_route('osh-levels.index');
        }, __('Failed to create OSH level.'));
    }

    public function update(UpdateOshLevelRequest $request, OshLevel $oshLevel): RedirectResponse
    {
        return $this->catchErrors(function () use ($request, $oshLevel) {
            $this->authorize('update', $oshLevel);

            $oshLevel->update($request->validated());

            Inertia::flash('toast', ['type' => 'success', 'message' => __('OSH level updated.')]);

            return back();
        }, __('Failed to update OSH level.'));
    }

    public function destroy(OshLevel $oshLevel): RedirectResponse
    {
        return $this->catchErrors(function () use ($oshLevel) {
            $this->authorize('delete', $oshLevel);

            $oshLevel->delete();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('OSH level deleted.')]);

            return back();
        }, __('Failed to delete OSH level.'));
    }

    public function reorder(): RedirectResponse
    {
        return $this->catchErrors(function () {
            $order = request()->input('order', []);

            foreach ($order as $position => $id) {
                OshLevel::where('id', $id)->update(['sort_order' => $position + 1]);
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => __('OSH levels reordered.')]);

            return back();
        }, __('Failed to reorder OSH levels.'));
    }
}
