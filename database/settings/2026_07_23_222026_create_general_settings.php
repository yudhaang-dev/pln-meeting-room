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
            $blueprint->add('cancellation_hours', 2);
            $blueprint->add('auto_approve_bookings', false);
            $blueprint->add('default_osh_level_id', null);
            $blueprint->add('display_refresh_interval', 30);
            $blueprint->add('media_loop_duration', 10);
        });
    }
};
