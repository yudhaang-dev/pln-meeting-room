<?php

namespace App\Http\Responses;

use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the authenticated user.
     */
    public function toResponse($request): RedirectResponse
    {
        $user = $request->user();

        return redirect()->intended(route('dashboard'));
    }
}
