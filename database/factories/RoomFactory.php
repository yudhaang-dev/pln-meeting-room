<?php

namespace Database\Factories;

use App\Models\Building;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Room>
 */
class RoomFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'building_id' => Building::factory(),
            'capacity' => fake()->numberBetween(2, 100),
            'is_active' => true,
        ];
    }
}
