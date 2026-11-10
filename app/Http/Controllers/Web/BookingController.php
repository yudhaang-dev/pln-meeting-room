<?php

namespace App\Http\Controllers\Web;

use App\Events\BookingCreated;
use App\Events\BookingUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\OshLevel;
use App\Models\Person;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct()
    {
        $this->middleware('throttle:10,1')->only('store');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'sort_by' => ['nullable', Rule::in(['title', 'start_time', 'status', 'created_at', 'participants_count'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', Rule::in(['10', '25', '50', '100'])],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $query = Booking::with(['room.building', 'requestedBy', 'approvedBy', 'chairperson']);

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
        $osh_levels = OshLevel::where('is_active', true)->orderBy('sort_order')->get();

        return inertia('bookings/index', [
            'bookings' => $bookings,
            'rooms' => $rooms,
            'people' => $people,
            'osh_levels' => $osh_levels,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBookingRequest $request): RedirectResponse
    {
        return $this->catchErrors(function () use ($request) {
            $validated = $request->validated();

            $attachmentPath = null;
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $attachmentPath = $file->store('bookings', 'public');
            }

            $qrAttendancePath = null;
            if ($request->hasFile('qr_attendance')) {
                $qrAttendancePath = $request->file('qr_attendance')->store('bookings/qr', 'public');
            }

            $booking = Booking::create([
                'room_id' => $validated['room_id'],
                'requested_id' => Auth::user()->id,
                'chairperson_id' => $validated['chairperson_id'],
                'osh_level_id' => $validated['osh_level_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'participants_count' => $validated['participants_count'],
                'media' => $validated['media'] ?? 'offline',
                'attachment_path' => $attachmentPath,
                'qr_attendance_path' => $qrAttendancePath,
                'status' => 'pending',
            ]);

            BookingCreated::dispatch($booking);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking created successfully.')]);

            return to_route('bookings.index');
        }, __('Failed to create booking.'));
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking): Response
    {
        $this->authorize('view', $booking);

        $booking->load(['room.building', 'requestedBy', 'chairperson', 'approvedBy']);

        $readOnly = ! Auth::user()->can('viewDetails', $booking);

        if ($readOnly) {
            $booking->makeHidden(['attachment_path', 'qr_attendance_path', 'attachment_url', 'qr_attendance_url', 'reason']);
            $booking->requestedBy?->makeHidden(['email']);
            $booking->approvedBy?->makeHidden(['email']);
        }

        $rooms = Room::where('is_active', true)->orderBy('name')->get();
        $people = Person::where('is_active', true)->orderBy('name')->get();
        $osh_levels = OshLevel::where('is_active', true)->orderBy('sort_order')->get();

        return inertia('bookings/show', [
            'booking' => $booking,
            'can_finish' => Auth::user()->can('finish', $booking),
            'read_only' => $readOnly,
            'rooms' => $rooms,
            'people' => $people,
            'osh_levels' => $osh_levels,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBookingRequest $request, Booking $booking): RedirectResponse
    {
        return $this->catchErrors(function () use ($request, $booking) {
            $this->authorize('update', $booking);

            $validated = $request->validated();

            if ($request->hasFile('attachment')) {
                $booking->deleteAttachment();
                $validated['attachment_path'] = $request->file('attachment')->store('bookings', 'public');
                unset($validated['attachment']);
            }

            if ($request->hasFile('qr_attendance')) {
                $booking->deleteQrAttendance();
                $validated['qr_attendance_path'] = $request->file('qr_attendance')->store('bookings/qr', 'public');
                unset($validated['qr_attendance']);
            }

            $booking->update($validated);

            BookingUpdated::dispatch($booking);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking updated.')]);

            return back();
        }, __('Failed to update booking.'));
    }

    public function destroy(Booking $booking): RedirectResponse
    {
        return $this->catchErrors(function () use ($booking) {
            $this->authorize('delete', $booking);

            $booking->deleteAttachment();
            $booking->deleteQrAttendance();

            BookingUpdated::dispatch($booking);

            $booking->delete();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking deleted.')]);

            return to_route('bookings.index');
        }, __('Failed to delete booking.'));
    }

    public function approve(Booking $booking): RedirectResponse
    {
        return $this->catchErrors(function () use ($booking) {
            $this->authorize('approve', $booking);

            $booking->update([
                'status' => 'approved',
                'approved_id' => Auth::user()->id,
                'approved_at' => now(),
            ]);

            BookingUpdated::dispatch($booking);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking approved.')]);

            return back();
        }, __('Failed to approve booking.'));
    }

    public function reject(Request $request, Booking $booking): RedirectResponse
    {
        return $this->catchErrors(function () use ($request, $booking) {
            $this->authorize('reject', $booking);

            $request->validate([
                'reason' => ['required', 'string', 'max:1000'],
            ]);

            $booking->update([
                'status' => 'rejected',
                'reason' => $request->input('reason'),
                'approved_id' => Auth::user()->id,
                'approved_at' => now(),
            ]);

            BookingUpdated::dispatch($booking);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking rejected.')]);

            return back();
        }, __('Failed to reject booking.'));
    }

    public function finish(Booking $booking): RedirectResponse
    {
        return $this->catchErrors(function () use ($booking) {
            $this->authorize('finish', $booking);

            $booking->update(['ended_at' => now()]);

            BookingUpdated::dispatch($booking, notify: false);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Meeting marked as finished.')]);

            return back();
        }, __('Failed to finish meeting.'));
    }
}
