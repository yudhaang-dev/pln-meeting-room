<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    private const DAYS = 7;

    /**
     * Kalender mingguan: rapat approved dari hari ini sampai 7 hari ke depan.
     */
    public function index(Request $request): Response
    {
        $request->validate(['start' => ['nullable', 'date_format:Y-m-d']]);

        $from = $request->filled('start')
            ? Carbon::createFromFormat('Y-m-d', $request->input('start'))->startOfDay()
            : now()->startOfDay();
        $to = $from->copy()->addDays(self::DAYS);

        $bookings = Booking::where('status', 'approved')
            ->where('start_time', '>=', $from)
            ->where('start_time', '<', $to)
            ->with(['room.building', 'chairperson', 'osh_level'])
            ->orderBy('start_time')
            ->get()
            ->groupBy(fn (Booking $b) => $b->start_time->format('Y-m-d'));

        $days = collect(range(0, self::DAYS - 1))->map(function (int $offset) use ($from, $bookings) {
            $date = $from->copy()->addDays($offset);

            return [
                'date' => $date->format('Y-m-d'),
                'is_today' => $date->isToday(),
                'bookings' => $bookings->get($date->format('Y-m-d'), collect())->values()->map(fn (Booking $b) => [
                    'id' => $b->id,
                    'title' => $b->title,
                    'room' => $b->room?->name,
                    'building' => $b->room?->building?->name,
                    'chairperson_id' => $b->chairperson_id,
                    'chairperson' => $b->chairperson?->name,
                    'media' => $b->media,
                    'osh_color' => $b->osh_level?->color,
                    'is_mine' => $b->requested_id === auth()->id(),
                    'start_time' => $b->start_time->format('Y-m-d H:i'),
                    'end_time' => $b->end_time->format('Y-m-d H:i'),
                    'effective_end_time' => $b->effective_end_time,
                    'ended' => $b->ended_at !== null,
                ])->all(),
            ];
        })->all();

        return Inertia::render('schedule/index', [
            'days' => $days,
            'range' => [
                'start' => $from->format('Y-m-d'),
                'prev' => $from->copy()->subDays(self::DAYS)->format('Y-m-d'),
                'next' => $from->copy()->addDays(self::DAYS)->format('Y-m-d'),
                'today' => now()->format('Y-m-d'),
            ],
        ]);
    }
}
