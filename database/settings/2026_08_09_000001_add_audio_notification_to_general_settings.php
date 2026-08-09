<?php

use Spatie\LaravelSettings\Migrations\SettingsBlueprint;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->inGroup('general', function (SettingsBlueprint $blueprint): void {
            $blueprint->add('audio_notification', null);
            $blueprint->delete('cancellation_hours');
            $blueprint->delete('default_osh_level_id');
        });
    }
};
