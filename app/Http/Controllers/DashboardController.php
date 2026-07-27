<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $userId = auth()->id();

        $upcomingBookingsCount = Booking::where('requested_id', $userId)
            ->approved()
            ->upcoming()
            ->count();

        $nextBookings = Booking::where('requested_id', $userId)
            ->approved()
            ->upcoming()
            ->with(['room', 'chairperson'])
            ->orderBy('start_time')
            ->limit(3)
            ->get();

        $totalRooms = Room::where('is_active', true)->count();

        return Inertia::render('dashboard', [
            'upcomingBookingsCount' => $upcomingBookingsCount,
            'nextBookings' => $nextBookings,
            'totalRooms' => $totalRooms,
        ]);
    }
}
