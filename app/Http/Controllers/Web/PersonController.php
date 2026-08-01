<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePersonRequest;
use App\Http\Requests\Admin\UpdatePersonRequest;
use App\Models\Person;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PersonController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Person::class);

        $sortBy = request('sort_by', 'name');
        $sortDirection = request('sort_direction', 'asc');
        $allowedSorts = ['name', 'is_active', 'created_at'];

        $people = Person::query()
            ->when(request('search'), fn ($query, $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->when(in_array($sortBy, $allowedSorts), fn ($query) => $query->orderBy($sortBy, $sortDirection))
            ->paginate(request('per_page', 10))
            ->withQueryString();

        return inertia('people/index', [
            'people' => $people,
        ]);
    }

    public function store(StorePersonRequest $request): RedirectResponse
    {
        $this->authorize('create', Person::class);

        $validated = $request->except('photo');

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $name = Str::random(40).'.'.$file->getClientOriginalExtension();
            $stream = fopen($file->getPathname(), 'r');
            if ($stream === false) {
                Inertia::flash('toast', ['type' => 'error', 'message' => __('Unable to read the uploaded photo.')]);

                return back();
            }
            Storage::disk('public')->put('people/'.$name, $stream);
            fclose($stream);
            $validated['photo'] = 'people/'.$name;
        }

        Person::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Person created.')]);

        return to_route('people.index');
    }

    public function update(UpdatePersonRequest $request, Person $person): RedirectResponse
    {
        $this->authorize('update', $person);

        $validated = $request->except('photo');

        if ($request->hasFile('photo')) {
            $person->deletePhoto();
            $file = $request->file('photo');
            $name = Str::random(40).'.'.$file->getClientOriginalExtension();
            $stream = fopen($file->getPathname(), 'r');
            if ($stream === false) {
                Inertia::flash('toast', ['type' => 'error', 'message' => __('Unable to read the uploaded photo.')]);

                return back();
            }
            Storage::disk('public')->put('people/'.$name, $stream);
            fclose($stream);
            $validated['photo'] = 'people/'.$name;
        }

        $person->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Person updated.')]);

        return back();
    }

    public function destroy(Person $person): RedirectResponse
    {
        $this->authorize('delete', $person);

        $person->deletePhoto();
        $person->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Person deleted.')]);

        return back();
    }
}
