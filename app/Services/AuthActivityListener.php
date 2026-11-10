<?php

namespace App\Services;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Contracts\Events\Dispatcher;

/**
 * Mencatat login berhasil, login gagal, pemblokiran, dan logout.
 * Kata sandi yang diketik tidak pernah disimpan.
 */
class AuthActivityListener
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(Login::class, [self::class, 'onLogin']);
        $events->listen(Logout::class, [self::class, 'onLogout']);
        $events->listen(Failed::class, [self::class, 'onFailed']);
        $events->listen(Lockout::class, [self::class, 'onLockout']);
    }

    public function onLogin(Login $event): void
    {
        ActivityLogger::record(
            event: 'auth.login',
            description: 'Login berhasil',
            userId: $event->user->getAuthIdentifier(),
            actorEmail: $event->user->email ?? null,
        );
    }

    public function onLogout(Logout $event): void
    {
        if (! $event->user) {
            return;
        }

        ActivityLogger::record(
            event: 'auth.logout',
            description: 'Logout',
            userId: $event->user->getAuthIdentifier(),
            actorEmail: $event->user->email ?? null,
        );
    }

    public function onFailed(Failed $event): void
    {
        ActivityLogger::record(
            event: 'auth.failed',
            description: 'Percobaan login gagal',
            userId: $event->user?->getAuthIdentifier(),
            actorEmail: isset($event->credentials['email']) ? mb_substr((string) $event->credentials['email'], 0, 255) : null,
        );
    }

    public function onLockout(Lockout $event): void
    {
        ActivityLogger::record(
            event: 'auth.lockout',
            description: 'Login diblokir sementara karena terlalu banyak percobaan',
            actorEmail: mb_substr((string) $event->request->input('email'), 0, 255) ?: null,
        );
    }
}
