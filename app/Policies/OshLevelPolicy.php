<?php

namespace App\Policies;

use App\Models\OshLevel;
use App\Models\User;

class OshLevelPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, OshLevel $oshLevel): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isOperator();
    }

    public function update(User $user, OshLevel $oshLevel): bool
    {
        return $user->isAdmin() || $user->isOperator();
    }

    public function delete(User $user, OshLevel $oshLevel): bool
    {
        return $user->isAdmin() || $user->isOperator();
    }
}
