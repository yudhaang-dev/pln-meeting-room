<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin User', 'password' => 'password', 'role' => 'admin', 'is_active' => true],
        );

        User::updateOrCreate(
            ['email' => 'operator@example.com'],
            ['name' => 'Operator User', 'password' => 'password', 'role' => 'operator', 'is_active' => true],
        );

        User::updateOrCreate(
            ['email' => 'user@example.com'],
            ['name' => 'Regular User', 'password' => 'password', 'role' => 'user', 'is_active' => true],
        );
    }
}
