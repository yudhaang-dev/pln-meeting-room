<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Concerns\LogsActivity;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $role
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $avatar
 * @property string|null $notification_audio
 * @property array<string, mixed>|null $dashboard_layout
 * @property bool $is_active
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'avatar', 'notification_audio', 'is_active'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, LogsActivity;

    protected $appends = ['avatar_url', 'notification_audio_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'dashboard_layout' => 'array',
        ];
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar ? Storage::disk('public')->url($this->avatar) : null;
    }

    public function deleteAvatar(): void
    {
        if ($this->avatar && Storage::disk('public')->exists($this->avatar)) {
            Storage::disk('public')->delete($this->avatar);
        }
    }

    public function getNotificationAudioUrlAttribute(): ?string
    {
        return $this->notification_audio ? Storage::disk('public')->url($this->notification_audio) : null;
    }

    public function deleteNotificationAudio(): void
    {
        if ($this->notification_audio && Storage::disk('public')->exists($this->notification_audio)) {
            Storage::disk('public')->delete($this->notification_audio);
        }

        $this->notification_audio = null;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function requestedBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'requested_id');
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function approvedBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'approved_id');
    }

    public static function activityKey(): string
    {
        return 'user';
    }

    public static function activityLabel(): string
    {
        return 'pengguna';
    }
}
