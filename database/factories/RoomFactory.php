<?php

namespace Database\Factories;

use App\Models\Building;
use Illuminate\Database\Eloquent\Factories\Factory;

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
