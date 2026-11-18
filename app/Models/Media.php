<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Database\Factories\MediaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $mediable_type
 * @property int $mediable_id
 * @property string $type
 * @property string|null $name
 * @property string $path
 * @property int $size
 * @property string|null $mime
 * @property array<int, string>|null $pages
 * @property int $sort_order
 * @property bool $is_active
 */
#[Fillable(['mediable_type', 'mediable_id', 'type', 'name', 'path', 'size', 'mime', 'pages', 'sort_order', 'is_active'])]
class Media extends Model
{
    /** @use HasFactory<MediaFactory> */
    use HasFactory, LogsActivity;

    protected $appends = ['file_url', 'page_urls'];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'pages' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->path ? Storage::disk('public')->url($this->path) : null;
    }

    /**
     * URL gambar per halaman untuk dokumen PDF (kosong bila belum dikonversi).
     *
     * @return array<int, string>
     */
    public function getPageUrlsAttribute(): array
    {
        return collect($this->pages ?? [])
            ->map(fn (string $page) => Storage::disk('public')->url($page))
            ->values()
            ->all();
    }

    public function deleteFile(): void
    {
        $this->deletePages();

        if ($this->path && Storage::disk('public')->exists($this->path)) {
            Storage::disk('public')->delete($this->path);
        }
    }

    public function deletePages(): void
    {
        foreach ($this->pages ?? [] as $page) {
            if (Storage::disk('public')->exists($page)) {
                Storage::disk('public')->delete($page);
            }
        }
    }

    /**
     * @param  Builder<Media>  $query
     * @return Builder<Media>
     */
    public function scopeGlobal(Builder $query): Builder
    {
        return $query->whereNull('mediable_type')->whereNull('mediable_id');
    }

    /**
     * @param  Builder<Media>  $query
     * @return Builder<Media>
     */
    public function scopeGlobalActive(Builder $query): Builder
    {
        return $query->global()->where('is_active', true)->orderBy('sort_order')->orderBy('id');
    }

    public static function activityKey(): string
    {
        return 'media';
    }

    public static function activityLabel(): string
    {
        return 'media';
    }
}
