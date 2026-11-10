<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Database\Factories\RoomFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property int $building_id
 * @property int $capacity
 * @property bool $is_active
 */
#[Fillable(['name', 'building_id', 'capacity', 'is_active'])]
class Room extends Model
{
    /** @use HasFactory<RoomFactory> */
    use HasFactory, LogsActivity;

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Building, $this>
     */
    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    /**
     * @return BelongsToMany<RoomGroup, $this>
     */
    public function roomGroups(): BelongsToMany
    {
        return $this->belongsToMany(RoomGroup::class)->withTimestamps();
    }

    /**
     * @return HasMany<Media, $this>
     */
    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'mediable_id')
            ->where('mediable_type', self::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public static function activityKey(): string
    {
        return 'room';
    }

    public static function activityLabel(): string
    {
        return 'ruangan';
    }
}
