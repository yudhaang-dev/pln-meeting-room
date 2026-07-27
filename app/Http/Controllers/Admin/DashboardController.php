<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Building;
use App\Models\Room;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $pendingBookings = Booking::pending()
            ->with(['room', 'requestedBy', 'chairperson'])
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        $recentBookings = Booking::with(['room', 'requestedBy', 'chairperson'])
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('admin/dashboard', [
            'totalBuildings' => Building::count(),
            'totalRooms' => Room::count(),
            'pendingBookingsCount' => Booking::pending()->count(),
            'totalUsers' => User::count(),
            'pendingBookings' => $pendingBookings,
            'recentBookings' => $recentBookings,
        ]);
    }
}
