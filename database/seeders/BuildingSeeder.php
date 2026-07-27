<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BuildingSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('buildings')->insert([
            ['name' => 'Gedung A', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Gedung B', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
