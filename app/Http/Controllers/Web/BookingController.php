<?php

namespace App\Http\Controllers\Web;

use App\Events\BookingUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Person;
use App\Models\Room;
use App\Notifications\BookingApproved;
use App\Notifications\BookingRejected;
use App\Settings\GeneralSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'sort_by' => ['nullable', Rule::in(['title', 'start_time', 'status', 'created_at', 'participants_count'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', Rule::in(['10', '25', '50', '100'])],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $query = Booking::with(['room', 'requestedBy', 'chairperson']);

        if ($request->user()->role == 'user') {
            $query->where('requested_id', $request->user()->id);
        }

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

        $perPage = (int) $request->input('per_page', 10);
        $bookings = $query->paginate($perPage);

        $rooms = Room::where('is_active', true)->orderBy('name')->get();
        $people = Person::where('is_active', true)->orderBy('name')->get();

        return inertia('bookings/index', [
            'bookings' => $bookings,
            'rooms' => $rooms,
            'people' => $people,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('bookings', 'public');
        }

        $settings = app(GeneralSettings::class);
        $shouldAutoApprove = $settings->auto_approve_bookings;

        $booking = Booking::create([
            'room_id' => $validated['room_id'],
            'requested_id' => Auth::user()->id,
            'chairperson_id' => $validated['chairperson_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'participants_count' => $validated['participants_count'],
            'attachment_path' => $attachmentPath,
            'status' => $shouldAutoApprove ? 'approved' : 'pending',
            'approved_id' => $shouldAutoApprove ? Auth::user()->id : null,
            'approved_at' => $shouldAutoApprove ? now() : null,
        ]);

        if ($shouldAutoApprove) {
            $booking->requestedBy->notify(new BookingApproved($booking));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking created successfully.']);

        return to_route('bookings.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking)
    {
        $this->authorize('view', $booking);

        $booking->load(['room', 'requestedBy', 'chairperson', 'approvedBy']);

        $rooms = Room::where('is_active', true)->orderBy('name')->get();
        $people = Person::where('is_active', true)->orderBy('name')->get();

        return inertia('bookings/show', [
            'booking' => $booking,
            'rooms' => $rooms,
            'people' => $people,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBookingRequest $request, Booking $booking): RedirectResponse
    {
        $this->authorize('update', $booking);

        $booking->update($request->validated());

        broadcast(new BookingUpdated($booking));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking updated.']);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Booking $booking): RedirectResponse
    {
        $this->authorize('delete', $booking);

        $booking->deleteAttachment();
        $booking->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking deleted.']);

        return to_route('bookings.index');
    }

    /**
     * Approve the specified booking.
     */
    public function approve(Booking $booking): RedirectResponse
    {
        $this->authorize('approve', $booking);

        $booking->update([
            'status' => 'approved',
            'approved_id' => Auth::user()->id,
            'approved_at' => now(),
        ]);

        $booking->requestedBy->notify(new BookingApproved($booking));

        broadcast(new BookingUpdated($booking));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Booking approved.']);

        return back();
    }

    /**
     * Reject the specified booking.
     */
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
