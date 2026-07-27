<?php

namespace App\Policies;

use App\Models\RoomGroup;
use App\Models\User;

class RoomGroupPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, RoomGroup $roomGroup): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isOperator();
    }

    public function update(User $user, RoomGroup $roomGroup): bool
    {
        return $user->isAdmin() || $user->isOperator();
    }

    public function delete(User $user, RoomGroup $roomGroup): bool
    {
        return $user->isAdmin() || $user->isOperator();
    }
}
