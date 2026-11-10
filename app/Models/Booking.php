<?php

namespace App\Models;

use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $room_id
 * @property int $requested_id
 * @property int|null $chairperson_id
 * @property string $title
 * @property string|null $description
 * @property Carbon $start_time
 * @property Carbon $end_time
 * @property int $participants_count
 * @property int|null $osh_level_id
 * @property string $status
 * @property string|null $attachment_path
 * @property string|null $qr_attendance_path
 * @property string|null $reason
 * @property int|null $approved_id
 * @property Carbon|null $approved_at
 */
#[Fillable(['requested_id', 'room_id', 'chairperson_id', 'title', 'description', 'start_time', 'end_time', 'participants_count', 'osh_level_id', 'attachment_path', 'qr_attendance_path', 'status', 'approved_id', 'approved_at', 'reason'])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    protected $appends = ['attachment_url', 'qr_attendance_url'];

    protected $with = ['osh_level'];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime:Y-m-d H:i',
            'end_time' => 'datetime:Y-m-d H:i',
            'participants_count' => 'integer',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_id');
    }

    /**
     * @return BelongsTo<Person, $this>
     */
    public function chairperson(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'chairperson_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_id');
    }

    public function osh_level()
    {
        return $this->belongsTo(OshLevel::class, 'osh_level_id', 'id');
    }

    /**
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('start_time', '>', now());
    }

    /**
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public function scopePast(Builder $query): Builder
    {
        return $query->where('end_time', '<', now());
    }

    /**
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    /**
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->whereDate('start_time', $date);
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment_path ? '/storage/'.ltrim($this->attachment_path, '/') : null;
    }

    public function getQrAttendanceUrlAttribute(): ?string
    {
        return $this->qr_attendance_path ? '/storage/'.ltrim($this->qr_attendance_path, '/') : null;
    }

    public function deleteAttachment(): void
    {
        if ($this->attachment_path && Storage::disk('public')->exists($this->attachment_path)) {
            Storage::disk('public')->delete($this->attachment_path);
        }
    }

    public function deleteQrAttendance(): void
    {
        if ($this->qr_attendance_path && Storage::disk('public')->exists($this->qr_attendance_path)) {
            Storage::disk('public')->delete($this->qr_attendance_path);
        }
    }
}
