<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    private const DAYS = 7;

    /**
     * Kalender mingguan: rapat approved dari hari ini sampai 7 hari ke depan.
     */
    public function index(): Response
    {
        $from = now()->startOfDay();
        $to = $from->copy()->addDays(self::DAYS);

        $bookings = Booking::where('status', 'approved')
            ->where('start_time', '>=', $from)
            ->where('start_time', '<', $to)
            ->where(function ($q) {
                $q->whereNull('ended_at')->orWhere('ended_at', '>', now()->subDay());
            })
            ->with(['room.building', 'chairperson'])
            ->orderBy('start_time')
            ->get()
            ->groupBy(fn (Booking $b) => $b->start_time->format('Y-m-d'));

        $days = collect(range(0, self::DAYS - 1))->map(function (int $offset) use ($from, $bookings) {
            $date = $from->copy()->addDays($offset);

            return [
                'date' => $date->format('Y-m-d'),
                'is_today' => $offset === 0,
                'bookings' => $bookings->get($date->format('Y-m-d'), collect())->values()->map(fn (Booking $b) => [
                    'id' => $b->id,
                    'title' => $b->title,
                    'room' => $b->room?->name,
                    'building' => $b->room?->building?->name,
                    'chairperson' => $b->chairperson?->name,
                    'media' => $b->media,
                    'is_mine' => $b->requested_id === auth()->id(),
                    'start_time' => $b->start_time->format('Y-m-d H:i'),
                    'end_time' => $b->end_time->format('Y-m-d H:i'),
                    'effective_end_time' => $b->effective_end_time,
                    'ended' => $b->ended_at !== null,
                ])->all(),
            ];
        })->all();

        return Inertia::render('schedule/index', ['days' => $days]);
    }
}
