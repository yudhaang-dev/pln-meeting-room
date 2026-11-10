<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Database\Factories\PersonFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $name
 * @property string|null $photo
 * @property bool $is_active
 */
#[Fillable(['name', 'photo', 'is_active'])]
class Person extends Model
{
    /** @use HasFactory<PersonFactory> */
    use HasFactory, LogsActivity;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ? Storage::disk('public')->url($this->photo) : null;
    }

    public function deletePhoto(): void
    {
        if ($this->photo && Storage::disk('public')->exists($this->photo)) {
            Storage::disk('public')->delete($this->photo);
        }
    }

    public static function activityKey(): string
    {
        return 'person';
    }

    public static function activityLabel(): string
    {
        return 'pimpinan acara';
    }
}
