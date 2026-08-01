<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Person;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $start = Carbon::tomorrow()->addHours($this->faker->numberBetween(1, 8));
        $end = $start->copy()->addHours($this->faker->numberBetween(1, 4));

        return [
            'room_id' => Room::factory(),
            'requested_id' => User::factory(),
            'chairperson_id' => Person::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->sentence(),
            'start_time' => $start,
            'end_time' => $end,
            'participants_count' => $this->faker->numberBetween(1, 50),
            'status' => 'pending',
            'attachment_path' => 'bookings/'.$this->faker->uuid().'.pdf',
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending']);
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => 'approved',
            'approved_id' => User::factory(),
            'approved_at' => Carbon::now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => 'rejected',
            'reason' => $this->faker->sentence(),
        ]);
    }
}
