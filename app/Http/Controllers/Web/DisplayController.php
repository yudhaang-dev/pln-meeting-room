<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Media;
use App\Models\Room;
use App\Models\RoomGroup;
use App\Settings\GeneralSettings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DisplayController extends Controller
{
    public function index(): Response
    {
        $roomGroups = RoomGroup::with('building')
            ->where('is_active', true)
            ->get();

        $rooms = Room::with('building')
            ->where('is_active', true)
            ->get();

        return Inertia::render('display/index', [
            'roomGroups' => $roomGroups,
            'rooms' => $rooms,
        ]);
    }

    public function lobby(Request $request, RoomGroup $roomGroup): Response
    {
        $orientation = $request->query('orientation', $request->cookie('display_orientation', 'landscape'));
        $settings = app(GeneralSettings::class);
        $refreshInterval = $settings->display_refresh_interval;
        $mediaLoopDuration = $settings->media_loop_duration;

        $roomGroup->load([
            'rooms' => fn ($q) => $q->where('is_active', true),
        ]);

        $roomIds = $roomGroup->rooms->pluck('id');

        $bookings = Booking::with(['room.building', 'chairperson'])
            ->whereIn('room_id', $roomIds)
            ->where('status', 'approved')
            ->whereDate('start_time', today())
            ->orderBy('start_time')
            ->get();

        return Inertia::render('display/lobby', [
            'roomGroup' => $roomGroup,
            'bookings' => $bookings,
            'media' => Media::globalActive()->get(),
            'orientation' => $orientation,
            'refreshInterval' => $refreshInterval,
            'mediaLoopDuration' => $mediaLoopDuration,
        ]);
    }

    public function room(Request $request, Room $room): Response
    {
        $orientation = $request->query('orientation', $request->cookie('display_orientation', 'landscape'));
        $settings = app(GeneralSettings::class);
        $refreshInterval = $settings->display_refresh_interval;
        $mediaLoopDuration = $settings->media_loop_duration;

        $room->load('building');

        $currentBooking = Booking::with(['chairperson', 'requestedBy'])
            ->where('room_id', $room->id)
            ->where('status', 'approved')
            ->where('start_time', '<=', now())
            ->where('end_time', '>=', now())
            ->first();

        $nextBooking = Booking::with(['chairperson'])
            ->where('room_id', $room->id)
            ->where('status', 'approved')
            ->where('start_time', '>', now())
            ->orderBy('start_time')
            ->first();

        return Inertia::render('display/room', [
            'room' => $room,
            'currentBooking' => $currentBooking,
            'nextBooking' => $nextBooking,
            'media' => Media::globalActive()->get(),
            'orientation' => $orientation,
            'refreshInterval' => $refreshInterval,
            'mediaLoopDuration' => $mediaLoopDuration,
        ]);
    }

    public function osh(Request $request): Response
    {
        $orientation = $request->query('orientation', $request->cookie('display_orientation', 'landscape'));
        $refreshInterval = app(GeneralSettings::class)->display_refresh_interval;

        $todayBookings = Booking::with(['room.building', 'chairperson'])
            ->where('status', 'approved')
            ->whereDate('start_time', today())
            ->orderBy('start_time')
            ->get();

        $tomorrowBookings = Booking::with(['room.building', 'chairperson'])
            ->where('status', 'approved')
            ->whereDate('start_time', today()->addDay())
            ->orderBy('start_time')
            ->get();

        return Inertia::render('display/osh', [
            'todayBookings' => $todayBookings,
            'tomorrowBookings' => $tomorrowBookings,
            'orientation' => $orientation,
            'refreshInterval' => $refreshInterval,
        ]);
    }

    public function infografis(Request $request): Response
    {
        $orientation = $request->query('orientation', $request->cookie('display_orientation', 'landscape'));
        $refreshInterval = app(GeneralSettings::class)->display_refresh_interval;
        $mediaLoopDuration = app(GeneralSettings::class)->media_loop_duration;

        $media = Media::globalActive()->get();

        return Inertia::render('display/infografis', [
            'orientation' => $orientation,
            'refreshInterval' => $refreshInterval,
            'mediaLoopDuration' => $mediaLoopDuration,
            'media' => $media,
        ]);
    }
}
