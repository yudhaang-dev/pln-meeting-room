<?php

namespace App\Models\Concerns;

use App\Services\ActivityLogger;
use Illuminate\Support\Facades\Auth;

/**
 * Mencatat pembuatan, perubahan, dan penghapusan model oleh user yang sedang login.
 *
 * Model menentukan:
 *  - $activityKey   : awalan event, mis. "booking" -> "booking.created"
 *  - $activityLabel : nama dalam bahasa Indonesia, mis. "booking"
 */
trait LogsActivity
{
    /** Atribut yang tidak boleh masuk log. */
    private static array $activityHidden = [
        'password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes',
        'updated_at', 'created_at',
    ];

    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            $model->logActivity('created', 'Menambah '.static::activityLabel().' '.$model->activitySubject());
        });

        static::updated(function ($model) {
            $changes = $model->activityChanges();

            if ($changes === []) {
                return;
            }

            [$event, $description] = $model->activityUpdateEvent($changes);

            $model->logActivity($event, $description, ['changes' => $changes]);
        });

        static::deleted(function ($model) {
            $model->logActivity('deleted', 'Menghapus '.static::activityLabel().' '.$model->activitySubject());
        });
    }

    public static function activityKey(): string
    {
        return strtolower(class_basename(static::class));
    }

    public static function activityLabel(): string
    {
        return strtolower(class_basename(static::class));
    }

    /** Nama singkat yang mudah dikenali di daftar log. */
    public function activitySubject(): string
    {
        return '"'.($this->name ?? $this->title ?? '#'.$this->getKey()).'"';
    }

    /**
     * @param  array<string, array{0: mixed, 1: mixed}>  $changes
     * @return array{0: string, 1: string}
     */
    protected function activityUpdateEvent(array $changes): array
    {
        return ['updated', 'Mengubah '.static::activityLabel().' '.$this->activitySubject()];
    }

    /**
     * @return array<string, array{0: mixed, 1: mixed}>
     */
    protected function activityChanges(): array
    {
        $changes = [];

        foreach ($this->getChanges() as $field => $new) {
            if (in_array($field, self::$activityHidden, true)) {
                continue;
            }

            $changes[$field] = [$this->getOriginal($field), $new];
        }

        return $changes;
    }

    /**
     * @param  array<string, mixed>|null  $properties
     */
    protected function logActivity(string $action, string $description, ?array $properties = null): void
    {
        $user = Auth::user();

        // Hanya aksi oleh user yang sedang login (bukan seeder, console, atau sistem).
        if (! $user) {
            return;
        }

        ActivityLogger::record(
            event: static::activityKey().'.'.$action,
            description: $description,
            userId: $user->getAuthIdentifier(),
            actorEmail: $user->email ?? null,
            subject: $this,
            properties: $properties,
        );
    }
}
