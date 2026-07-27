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

        // if ($user->isAdmin() || $user->isOperator()) {
        //     return redirect()->intended(route('admin.dashboard'));
        // }

        return redirect()->intended(route('dashboard'));
    }
}
