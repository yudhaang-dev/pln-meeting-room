<?php

namespace Database\Factories;

use App\Models\Media;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'mediable_type' => Room::class,
            'mediable_id' => Room::factory(),
            'type' => $this->faker->randomElement(['image', 'video', 'document']),
            'name' => $this->faker->optional()->words(2, true),
            'path' => 'media/'.$this->faker->uuid().'.jpg',
            'size' => $this->faker->numberBetween(1000, 10000000),
            'mime' => $this->faker->randomElement(['image/jpeg', 'video/mp4', 'application/pdf']),
            'sort_order' => $this->faker->numberBetween(0, 10),
            'is_active' => true,
        ];
    }
}
