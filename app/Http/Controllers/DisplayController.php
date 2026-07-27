<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use App\Models\RoomGroup;
use App\Settings\GeneralSettings;
use Illuminate\Http\Request;

class DisplayController extends Controller
{
    public function lobby(RoomGroup $roomGroup, Request $request)
    {
        $orientation = $request->query('orientation', $request->cookie('display_orientation', 'landscape'));
        $settings = app(GeneralSettings::class);

        $roomGroup->load(['rooms', 'media' => function ($q) {
            $q->where('is_active', true)->orderBy('sort_order');
        }]);

        $roomIds = $roomGroup->rooms->pluck('id');

        $todayBookings = Booking::whereIn('room_id', $roomIds)
            ->where('status', 'approved')
            ->whereDate('start_time', today())
            ->with(['room', 'chairperson'])
            ->orderBy('start_time')
            ->get();

        return inertia('display/lobby', [
            'roomGroup' => $roomGroup,
            'bookings' => $todayBookings,
            'orientation' => $orientation,
            'refreshInterval' => $settings->display_refresh_interval,
            'mediaLoopDuration' => $settings->media_loop_duration,
        ]);
    }

    public function room(Room $room, Request $request)
    {
        $orientation = $request->query('orientation', $request->cookie('display_orientation', 'landscape'));
        $settings = app(GeneralSettings::class);

        $room->load(['media' => function ($q) {
            $q->where('is_active', true)->orderBy('sort_order');
        }]);

        $now = now();

        $currentBooking = Booking::where('room_id', $room->id)
            ->where('status', 'approved')
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->with(['chairperson'])
            ->first();

        $nextBooking = Booking::where('room_id', $room->id)
            ->where('status', 'approved')
            ->where('start_time', '>', $now)
            ->with(['chairperson'])
            ->orderBy('start_time')
            ->first();

        return inertia('display/room', [
            'room' => $room,
            'currentBooking' => $currentBooking,
            'nextBooking' => $nextBooking,
            'orientation' => $orientation,
            'refreshInterval' => $settings->display_refresh_interval,
            'mediaLoopDuration' => $settings->media_loop_duration,
        ]);
    }

    public function osh(Request $request)
    {
        $orientation = $request->query('orientation', $request->cookie('display_orientation', 'landscape'));
        $settings = app(GeneralSettings::class);

        $todayBookings = Booking::where('status', 'approved')
            ->whereDate('start_time', today())
            ->with(['room', 'chairperson'])
            ->orderBy('start_time')
            ->get();

        $tomorrowBookings = Booking::where('status', 'approved')
            ->whereDate('start_time', now()->tomorrow())
            ->with(['room', 'chairperson'])
            ->orderBy('start_time')
            ->get();

        return inertia('display/osh', [
            'todayBookings' => $todayBookings,
            'tomorrowBookings' => $tomorrowBookings,
            'orientation' => $orientation,
            'refreshInterval' => $settings->display_refresh_interval,
        ]);
    }
}
