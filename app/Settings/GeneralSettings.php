<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class GeneralSettings extends Settings
{
    public int $booking_advance_hours;

    public int $booking_max_days_ahead;

    public int $display_refresh_interval;

    public int $media_loop_duration;

    public ?string $audio_notification;

    public static function group(): string
    {
        return 'general';
    }
}
