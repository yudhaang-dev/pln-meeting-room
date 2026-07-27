<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OshLevelSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('osh_levels')->insert([
            ['name' => 'low', 'color' => '#22c55e', 'min_participants' => 1, 'max_participants' => 20, 'sort_order' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'mid', 'color' => '#eab308', 'min_participants' => 21, 'max_participants' => 50, 'sort_order' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'high', 'color' => '#ef4444', 'min_participants' => 51, 'max_participants' => 9999, 'sort_order' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
