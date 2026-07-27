<?php

namespace App\Models;

use Database\Factories\OshLevelFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $color
 * @property int $min_participants
 * @property int $max_participants
 * @property int $sort_order
 * @property bool $is_active
 */
#[Fillable(['name', 'color', 'min_participants', 'max_participants', 'sort_order', 'is_active'])]
class OshLevel extends Model
{
    /** @use HasFactory<OshLevelFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'min_participants' => 'integer',
            'max_participants' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public static function determineForParticipants(int $count): ?self
    {
        return static::where('is_active', true)
            ->where('min_participants', '<=', $count)
            ->where('max_participants', '>=', $count)
            ->orderBy('sort_order')
            ->first();
    }
}
