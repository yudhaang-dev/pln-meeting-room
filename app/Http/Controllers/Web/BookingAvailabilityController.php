<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use App\Settings\GeneralSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class BookingAvailabilityController extends Controller
{
    private const MAX_RANGE_DAYS = 400;

    /**
     * Slot terisi (Pending dan Approved). Tidak membocorkan judul atau pemohon;
     * hanya waktu dan status.
     *
     * - ?date=Y-m-d            : semua ruangan aktif pada satu tanggal.
     * - ?room_id=&from=&to=    : satu ruangan pada rentang tanggal, beserta aturan booking.
     * - ?exclude=<id>          : abaikan satu booking (saat mengubah booking sendiri).
     */
    public function __invoke(Request $request, GeneralSettings $settings): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required_without:room_id', 'nullable', 'date_format:Y-m-d'],
            'room_id' => ['required_without:date', 'nullable', 'integer', 'exists:rooms,id'],
            'from' => ['required_with:room_id', 'nullable', 'date_format:Y-m-d'],
            'to' => ['required_with:room_id', 'nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'exclude' => ['nullable', 'integer'],
        ]);

        if (! empty($validated['room_id'])) {
            return $this->forRoom($validated, $settings);
        }

        return $this->forDate($validated);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function forDate(array $validated): JsonResponse
    {
        $dayStart = Carbon::createFromFormat('Y-m-d', $validated['date'])->startOfDay();
        $busy = $this->busy($dayStart, $dayStart->copy()->addDay(), $validated)->groupBy('room_id');

        $rooms = Room::where('is_active', true)
            ->with('building')
            ->orderBy('name')
            ->get()
            ->map(fn (Room $room) => [
                'id' => $room->id,
                'name' => $room->name,
                'capacity' => $room->capacity,
                'building' => $room->building?->name,
                'slots' => $this->slots($busy->get($room->id, collect())),
            ])
            ->all();

        return response()->json(['date' => $validated['date'], 'rooms' => $rooms]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function forRoom(array $validated, GeneralSettings $settings): JsonResponse
    {
        $from = Carbon::createFromFormat('Y-m-d', $validated['from'])->startOfDay();
        $to = Carbon::createFromFormat('Y-m-d', $validated['to'])->startOfDay()->addDay();

        abort_if($from->diffInDays($to) > self::MAX_RANGE_DAYS, 422, __('Rentang tanggal terlalu panjang.'));

        $busy = $this->busy($from, $to, $validated)->where('room_id', (int) $validated['room_id']);

        return response()->json([
            'room_id' => (int) $validated['room_id'],
            'slots' => $this->slots($busy),
            'rules' => [
                'now' => now()->format('Y-m-d H:i'),
                'advance_hours' => $settings->booking_advance_hours,
                'max_days_ahead' => $settings->booking_max_days_ahead,
            ],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return Collection<int, Booking>
     */
    private function busy(Carbon $from, Carbon $to, array $validated): Collection
    {
        return Booking::whereIn('status', ['pending', 'approved'])
            ->when($validated['exclude'] ?? null, fn ($q, $id) => $q->where('id', '!=', $id))
            ->when($validated['room_id'] ?? null, fn ($q, $id) => $q->where('room_id', $id))
            ->where('start_time', '<', $to)
            ->whereRaw('COALESCE(ended_at, end_time) > ?', [$from->toDateTimeString()])
            ->orderBy('start_time')
            ->get();
    }

    /**
     * @param  Collection<int, Booking>  $bookings
     * @return array<int, array<string, string>>
     */
    private function slots(Collection $bookings): array
    {
        return $bookings->values()->map(fn (Booking $b) => [
            'start' => $b->start_time->format('Y-m-d H:i'),
            'end' => ($b->ended_at ?? $b->end_time)->format('Y-m-d H:i'),
            'status' => $b->status,
        ])->all();
    }
}
