<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Inertia\Inertia;
use Inertia\Response;

class MeetingRoomController extends Controller
{
    private const PREVIEW_LIMIT = 5;

    /**
     * Daftar ruangan aktif beserta beberapa rapat mendatang (approved) masing-masing.
     */
    public function index(): Response
    {
        $upcoming = $this->upcomingQuery()
            ->get()
            ->groupBy('room_id');

        $rooms = Room::where('is_active', true)
            ->with('building')
            ->orderBy('name')
            ->get()
            ->map(function (Room $room) use ($upcoming) {
                $items = $upcoming->get($room->id, collect());

                return [
                    'id' => $room->id,
                    'name' => $room->name,
                    'capacity' => $room->capacity,
                    'building' => $room->building?->name,
                    'upcoming_total' => $items->count(),
                    'upcoming' => $items->take(self::PREVIEW_LIMIT)->values()->map(fn (Booking $b) => $this->row($b)),
                ];
            });

        return Inertia::render('meeting-rooms/index', [
            'rooms' => $rooms,
            'previewLimit' => self::PREVIEW_LIMIT,
        ]);
    }

    /**
     * Semua rapat mendatang untuk satu ruangan.
     */
    public function show(Room $room): Response
    {
        $room->load('building');

        $items = $this->upcomingQuery()
            ->where('room_id', $room->id)
            ->get()
            ->map(fn (Booking $b) => $this->row($b));

        return Inertia::render('meeting-rooms/show', [
            'room' => [
                'id' => $room->id,
                'name' => $room->name,
                'capacity' => $room->capacity,
                'building' => $room->building?->name,
            ],
            'bookings' => $items,
        ]);
    }

    private function upcomingQuery()
    {
        return Booking::where('status', 'approved')
            ->whereRaw('COALESCE(ended_at, end_time) > ?', [now()->toDateTimeString()])
            ->with('chairperson')
            ->orderBy('start_time');
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'title' => $booking->title,
            'chairperson' => $booking->chairperson?->name,
            'participants_count' => $booking->participants_count,
            'media' => $booking->media,
            'is_mine' => $booking->requested_id === auth()->id(),
            'start_time' => $booking->start_time->format('Y-m-d H:i'),
            'end_time' => $booking->end_time->format('Y-m-d H:i'),
            'effective_end_time' => $booking->effective_end_time,
        ];
    }
}
