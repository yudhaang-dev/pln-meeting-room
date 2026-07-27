<?php

namespace Database\Seeders;

use App\Models\Person;
use Illuminate\Database\Seeder;

class PersonSeeder extends Seeder
{
    public function run(): void
    {
        Person::insert([
            ['name' => 'Budi Santoso', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Siti Rahayu', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Andi Wijaya', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Dewi Lestari', 'is_active' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
