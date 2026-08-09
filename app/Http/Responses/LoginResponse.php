<?php

namespace App\Http\Responses;

use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the authenticated user.
     */
    public function toResponse($request): RedirectResponse
    {
        $pending_count = $request->user()->role != 'user' ? Booking::where('status', 'pending')->count() : 0;

        return redirect()->intended(route('dashboard'))->with([
            'pending_count' => $pending_count,
        ]);
    }
}
