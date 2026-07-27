<?php

namespace Database\Factories;

use App\Models\OshLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OshLevel>
 */
class OshLevelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'color' => fake()->hexColor(),
            'min_participants' => 1,
            'max_participants' => 100,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }
}
