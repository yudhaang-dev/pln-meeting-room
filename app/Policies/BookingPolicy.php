<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Booking $booking): bool
    {
        return $user->isAdmin()
            || $user->isOperator()
            || $booking->requested_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Booking $booking): bool
    {
        return $user->isAdmin() || $user->isOperator();
    }

    public function delete(User $user, Booking $booking): bool
    {
        if ($booking->requested_id === $user->id && $booking->status === 'rejected') {
            return true;
        }

        return $user->isAdmin() || $user->isOperator();
    }

    public function cancel(User $user, Booking $booking): bool
    {
        if ($booking->requested_id !== $user->id) {
            return false;
        }

        if (! in_array($booking->status, ['pending', 'approved'], true)) {
            return false;
        }

        return $booking->start_time->isFuture();
    }

    public function approve(User $user, Booking $booking): bool
    {
        return ($user->isAdmin() || $user->isOperator())
            && $booking->status === 'pending';
    }

    public function reject(User $user, Booking $booking): bool
    {
        return ($user->isAdmin() || $user->isOperator())
            && $booking->status === 'pending';
    }

    public function finish(User $user, Booking $booking): bool
    {
        return ($user->isAdmin() || $user->isOperator())
            && $booking->isOngoing();
    }
}
