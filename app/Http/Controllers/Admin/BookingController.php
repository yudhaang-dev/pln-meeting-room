<?php

namespace App\Http\Controllers\Admin;

use App\Events\BookingUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Person;
use App\Models\Room;
use App\Models\User;
use App\Notifications\BookingApproved;
use App\Notifications\BookingRejected;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'sort_by' => ['nullable', Rule::in(['title', 'start_time', 'status', 'created_at', 'participants_count'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', Rule::in(['5', '10', '25', '50'])],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $query = Booking::with(['room', 'requestedBy', 'chairperson']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('room', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('requestedBy', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        $sortBy = $request->input('sort_by', 'start_time');
        $sortDirection = $request->input('sort_direction', 'desc');

        if ($sortBy === 'start_time') {
            $query->orderBy('start_time', $sortDirection);
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        $perPage = (int) $request->input('per_page', 15);
        $bookings = $query->paginate($perPage);

        $rooms = Room::where('is_active', true)->orderBy('name')->get();
        $people = Person::where('is_active', true)->orderBy('name')->get();

        return inertia('admin/bookings/index', [
            'bookings' => $bookings,
            'rooms' => $rooms,
            'people' => $people,
        ]);
    }

    public function show(Booking $booking)
    {
        $this->authorize('view', $booking);

        $booking->load(['room', 'requestedBy', 'chairperson', 'approvedBy']);

        return inertia('admin/bookings/show', [
            'booking' => $booking,
        ]);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorize('update', $booking);

        $booking->update($request->validated());

        broadcast(new BookingUpdated($booking));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking updated.']);

        return back();
    }

    public function destroy(Booking $booking): RedirectResponse
    {
        $this->authorize('delete', $booking);

        if ($booking->attachment_path && Storage::disk('public')->exists($booking->attachment_path)) {
            Storage::disk('public')->delete($booking->attachment_path);
        }

        $booking->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking deleted.']);

        return to_route('admin.bookings.index');
    }

    public function approve(Booking $booking): RedirectResponse
    {
        $this->authorize('approve', $booking);

        $booking->update([
            'status' => 'approved',
            'approved_id' => auth()->id(),
            'approved_at' => now(),
        ]);

        $booking->requestedBy->notify(new BookingApproved($booking));

        broadcast(new BookingUpdated($booking));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking approved.']);

        return back();
    }

    public function reject(Request $request, Booking $booking): RedirectResponse
    {
        $this->authorize('reject', $booking);

        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $booking->update([
            'status' => 'rejected',
            'reason' => $request->input('reason'),
        ]);

        $booking->requestedBy->notify(new BookingRejected($booking));

        broadcast(new BookingUpdated($booking));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking rejected.']);

        return back();
    }
}
