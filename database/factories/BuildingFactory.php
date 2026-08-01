<?php

namespace Database\Factories;

use App\Models\Building;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Building>
 */
class BuildingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
            'is_active' => true,
        ];
    }
}
