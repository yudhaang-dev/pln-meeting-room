<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $upcomingBookingsCount = Booking::where('requested_id', $request->user()->id)
            ->where('start_time', '>', now())
            ->whereIn('status', ['pending', 'approved'])
            ->count();

        $nextBookings = Booking::where('requested_id', $request->user()->id)
            ->where('start_time', '>', now())
            ->whereIn('status', ['pending', 'approved'])
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
