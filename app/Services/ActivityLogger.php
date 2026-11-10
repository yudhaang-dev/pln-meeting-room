<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Throwable;

class ActivityLogger
{
    /** Log lebih lama dari ini dihapus otomatis. */
    public const RETENTION_DAYS = 180;

    /**
     * Catat satu aktivitas. Kegagalan mencatat tidak boleh menggagalkan aksi pengguna.
     *
     * @param  array<string, mixed>|null  $properties
     */
    public static function record(
        string $event,
        string $description,
        ?int $userId = null,
        ?string $actorEmail = null,
        ?Model $subject = null,
        ?array $properties = null,
    ): void {
        try {
            $request = request();

            ActivityLog::create([
                'user_id' => $userId,
                'actor_email' => $actorEmail,
                'event' => $event,
                'description' => $description,
                'subject_type' => $subject ? class_basename($subject) : null,
                'subject_id' => $subject?->getKey(),
                'properties' => $properties,
                'ip_address' => $request?->ip(),
                'user_agent' => $request ? mb_substr((string) $request->userAgent(), 0, 500) : null,
            ]);

            // Pembersihan oportunistik agar tidak butuh scheduler.
            if (random_int(1, 200) === 1) {
                ActivityLog::where('created_at', '<', now()->subDays(self::RETENTION_DAYS))->delete();
            }
        } catch (Throwable $e) {
            report($e);
        }
    }
}
