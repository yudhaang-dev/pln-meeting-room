<?php

use Spatie\LaravelSettings\Migrations\SettingsBlueprint;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->inGroup('general', function (SettingsBlueprint $blueprint): void {
            $blueprint->add('booking_advance_hours', 24);
            $blueprint->add('booking_max_days_ahead', 30);
            $blueprint->add('display_refresh_interval', 30);
            $blueprint->add('media_loop_duration', 10);
            $blueprint->add('audio_notification', null);
        });
    }
};
