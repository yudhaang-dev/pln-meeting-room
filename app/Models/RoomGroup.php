<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Database\Factories\RoomGroupFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $building_id
 * @property string $name
 * @property bool $is_active
 */
#[Fillable(['building_id', 'name', 'is_active'])]
class RoomGroup extends Model
{
    /** @use HasFactory<RoomGroupFactory> */
    use HasFactory, LogsActivity;

    protected function casts(): array
    {
        return [
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
     * @return BelongsToMany<Room, $this>
     */
    public function rooms(): BelongsToMany
    {
        return $this->belongsToMany(Room::class)->withTimestamps();
    }

    /**
     * @return HasMany<Media, $this>
     */
    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'mediable_id')
            ->where('mediable_type', self::class)
            ->orderBy('sort_order');
    }

    public static function activityKey(): string
    {
        return 'room_group';
    }

    public static function activityLabel(): string
    {
        return 'kelompok ruangan';
    }
}
