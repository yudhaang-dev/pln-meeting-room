<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoomGroupSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('room_groups')->insert([
            ['building_id' => 1, 'name' => 'Lobby Lantai 1', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['building_id' => 1, 'name' => 'Lobby Lantai 2', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['building_id' => 2, 'name' => 'Lobby', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
