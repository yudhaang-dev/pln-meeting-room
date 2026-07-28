<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Building;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        if (in_array($request->user()->role, ['admin', 'operator'], true)) {
            return $this->admin($request);
        }

        return $this->user($request);
    }

    private function admin(Request $request): Response
    {
        $pendingBookings = Booking::pending()
            ->with(['room', 'requestedBy', 'chairperson'])
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        $recentBookings = Booking::with(['room', 'requestedBy', 'chairperson'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('dashboard/admin', [
            'totalBuildings' => Building::count(),
            'totalRooms' => Room::where('is_active', true)->count(),
            'pendingBookingsCount' => Booking::pending()->count(),
            'totalUsers' => User::count(),
            'pendingBookings' => $pendingBookings,
            'recentBookings' => $recentBookings,
        ]);
    }

    private function user(Request $request): Response
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

        return Inertia::render('dashboard/index', [
            'upcomingBookingsCount' => $upcomingBookingsCount,
            'nextBookings' => $nextBookings,
            'totalRooms' => $totalRooms,
        ]);
    }
}
