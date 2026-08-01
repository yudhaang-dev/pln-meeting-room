<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\RoomGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RoomGroup>
 */
class RoomGroupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'building_id' => Building::factory(),
            'name' => fake()->unique()->words(2, true),
            'is_active' => true,
        ];
    }
}
