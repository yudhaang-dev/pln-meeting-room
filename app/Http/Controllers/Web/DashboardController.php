<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use App\Services\DashboardStatistics;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private DashboardStatistics $statistics) {}

    public function __invoke(Request $request): Response
    {
        if (in_array($request->user()->role, ['admin', 'operator'], true)) {
            return $this->admin($request);
        }

        return $this->user($request);
    }

    /**
     * Status ruangan saat ini: tiap ruangan aktif beserta rapat approved yang sedang berlangsung.
     *
     * @return array<int, array<string, mixed>>
     */
    private function roomStatuses(): array
    {
        $now = now();

        $ongoing = Booking::where('status', 'approved')
            ->where('start_time', '<=', $now)
            ->whereRaw('COALESCE(ended_at, end_time) > ?', [$now->toDateTimeString()])
            ->with('chairperson')
            ->orderBy('start_time')
            ->get()
            ->groupBy('room_id');

        return Room::where('is_active', true)
            ->with('building')
            ->orderBy('name')
            ->get()
            ->map(function (Room $room) use ($ongoing) {
                $booking = $ongoing->get($room->id)?->first();

                return [
                    'id' => $room->id,
                    'name' => $room->name,
                    'building' => $room->building?->name,
                    'booking' => $booking ? [
                        'id' => $booking->id,
                        'title' => $booking->title,
                        'chairperson' => $booking->chairperson?->name,
                        'start_time' => $booking->start_time->format('Y-m-d H:i'),
                        'end_time' => $booking->end_time->format('Y-m-d H:i'),
                        'effective_end_time' => $booking->effective_end_time,
                    ] : null,
                ];
            })
            ->all();
    }

    private function admin(Request $request): Response
    {
        return Inertia::render('dashboard/admin', [
            'roomStatuses' => $this->roomStatuses(),
            'statistics' => [
                'eventsMonthly' => $this->statistics->monthlyEvents(),
                'eventsByStatus' => $this->statistics->eventsByStatus(),
                'participantsMonthly' => $this->statistics->monthlyParticipants(),
                'participantsByRoom' => $this->statistics->participantsByRoom(),
                'usersMonthly' => $this->statistics->monthlyUsers(),
                'usersShare' => $this->statistics->usersShare(),
                'roomsMonthly' => $this->statistics->monthlyRooms(),
                'roomsShare' => $this->statistics->roomsShare(),
            ],
        ]);
    }

    private function user(Request $request): Response
    {
        $request->validate([
            'per_page' => ['nullable', Rule::in(['10', '25', '50', '100'])],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $myBookings = Booking::where('requested_id', $request->user()->id);

        $schedule = Booking::where('status', 'approved')
            ->where('start_time', '>=', now()->startOfDay())
            ->with(['room.building', 'requestedBy', 'chairperson'])
            ->orderBy('start_time');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $schedule->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('room', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('requestedBy', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        return Inertia::render('dashboard/index', [
            'roomStatuses' => $this->roomStatuses(),
            'totalBookings' => (clone $myBookings)->count(),
            'pendingBookingsCount' => (clone $myBookings)->where('status', 'pending')->count(),
            'approvedBookingsCount' => (clone $myBookings)->where('status', 'approved')->count(),
            'rejectedBookingsCount' => (clone $myBookings)->where('status', 'rejected')->count(),
            'approvedSchedule' => $schedule->paginate((int) $request->input('per_page', 10)),
        ]);
    }
}
