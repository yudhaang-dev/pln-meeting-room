<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class BookingAvailabilityController extends Controller
{
    /**
     * Slot terisi (Pending dan Approved) per ruangan aktif pada satu tanggal.
     * Tidak membocorkan judul atau pemohon; hanya waktu dan status.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'exclude' => ['nullable', 'integer'],
        ]);

        $dayStart = Carbon::createFromFormat('Y-m-d', $validated['date'])->startOfDay();
        $dayEnd = $dayStart->copy()->addDay();

        $busy = Booking::whereIn('status', ['pending', 'approved'])
            ->when($validated['exclude'] ?? null, fn ($q, $id) => $q->where('id', '!=', $id))
            ->where('start_time', '<', $dayEnd)
            ->whereRaw('COALESCE(ended_at, end_time) > ?', [$dayStart->toDateTimeString()])
            ->orderBy('start_time')
            ->get()
            ->groupBy('room_id');

        $rooms = Room::where('is_active', true)
            ->with('building')
            ->orderBy('name')
            ->get()
            ->map(fn (Room $room) => [
                'id' => $room->id,
                'name' => $room->name,
                'capacity' => $room->capacity,
                'building' => $room->building?->name,
                'slots' => $busy->get($room->id, collect())->values()->map(fn (Booking $b) => [
                    'start' => $b->start_time->format('Y-m-d H:i'),
                    'end' => ($b->ended_at ?? $b->end_time)->format('Y-m-d H:i'),
                    'status' => $b->status,
                ])->all(),
            ])
            ->all();

        return response()->json(['date' => $validated['date'], 'rooms' => $rooms]);
    }
}
