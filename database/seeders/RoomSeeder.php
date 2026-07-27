<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('rooms')->insert([
            ['name' => 'Ruang Garuda', 'capacity' => 20, 'building_id' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ruang Rajawali', 'capacity' => 10, 'building_id' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ruang Merpati', 'capacity' => 15, 'building_id' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ruang Elang', 'capacity' => 30, 'building_id' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ruang Pelatihan A', 'capacity' => 50, 'building_id' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('room_room_group')->insert([
            ['room_id' => 1, 'room_group_id' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['room_id' => 2, 'room_group_id' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['room_id' => 3, 'room_group_id' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['room_id' => 4, 'room_group_id' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['room_id' => 5, 'room_group_id' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
