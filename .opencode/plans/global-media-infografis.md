# Plan: Media Global ("Infografis") + Realtime 2-Event untuk Display

## Konteks
Client meminta media display diperlakukan global (satu library untuk semua display), bukan per room/room-group.
Keputusan user:
- Kode per-entity (`rooms.media.*`, `room-groups.media.*`, `RoomController::media`, `RoomGroupController::media`, halaman `rooms/media.tsx` & `room-groups/media.tsx`, test MediaTest) **dibiarkan sebagai dead code** — tidak dihapus, hanya tombol UI-nya dihilangkan.
- OSH display tetap tanpa media.
- Halaman admin media global: **menu terpisah "Infografis"** (`/infografis`).
- Realtime display cukup **2 event type**: `BookingUpdated` + `MediaUpdated`; tiap display refetch data yang dibutuhkan.
- 4 dead broadcast (`RoomCreated`, `RoomUpdated`, `RoomGroupCreated`, `RoomGroupUpdated`) **dihapus** — tidak ada listener, dan tidak menyentuh notifikasi personal booking (`BookingStatusNotification`/`SendBookingNotification` adalah jalur terpisah).

## Model data
- Media global = baris dengan `mediable_type = NULL` dan `mediable_id = NULL`.

---

## Backend

### 1. Migrasi (SUDAH dibuat skeleton)
`database/migrations/2026_08_09_150337_make_media_mediable_nullable.php`
```php
up(): DB::table('media')->update(['mediable_type' => null, 'mediable_id' => null]);
      Schema::table('media', fn (Blueprint $table) =>
        $table->string('mediable_type')->nullable()->change();
        $table->unsignedBigInteger('mediable_id')->nullable()->change();
      );
down(): balik (data di-set ''/0 lalu kolom NOT NULL lagi).
```

### 2. Model `App\Models\Media`
Tambah scope:
```php
public function scopeGlobal(Builder $query): Builder
{
    return $query->whereNull('mediable_type')->whereNull('mediable_id');
}

public function scopeGlobalActive(Builder $query): Builder
{
    return $query->global()->where('is_active', true)->orderBy('sort_order');
}
```

### 3. `App\Http\Controllers\Web\MediaController`
- Ganti `handleMediableBroadcast(Room|RoomGroup $mediable)` → `broadcastMediaUpdated(Media $media)`:
  - `$media->loadMissing('mediable')`
  - mediable `Room` → `Display.Room.{id}`, `RoomGroup` → `Display.RoomGroup.{id}`
  - **null → `PublicBroadcast::dispatch('Display.Global', 'MediaUpdated', [])`** (media global)
- Semua panggilan broadcast (`store`, `assemble`, `reorder`, `toggleActive`, `destroy`, `bulkDelete`) diganti ke `broadcastMediaUpdated`.
- `indexGlobal(): Response` → `inertia('infografis/index', ['media' => Media::globalActive()->get()])` + `authorize('viewAny', Media::class)`.
- `storeGlobal(): RedirectResponse` → validasi `files` (sama seperti doStore), buat Media dengan mediable null, flash `media`, `broadcastMediaUpdated`.
- `bulkDeleteGlobal(): RedirectResponse` → hapus media global (whereIn ids + whereNull), `broadcastMediaUpdated` per item pertama atau broadcast global.
- `assemble()`: `mediable_type` validation jadi `in:global,rooms,room-groups`; jika `'global'` → mediable null, `broadcastMediaUpdated` (bukan `resolveMediable`).
- `toggleActive(mixed $parent, Media $media)` → `toggleActive(Media $media)`; ganti isi dengan `broadcastMediaUpdated($media)`.
- `destroy(mixed $parent, Media $media)` → `destroy(Media $media)`; ganti `resolveMediable`/`handleMediableBroadcast` dengan `broadcastMediaUpdated`.
- Hapus `resolveMediable` (tak terpakai lagi).

### 4. Hapus dead broadcast
- `RoomController::store` / `update`: hapus `PublicBroadcast::dispatch(...)`, hapus `use App\Events\PublicBroadcast;`.
- `RoomGroupController::store` / `update`: hapus `PublicBroadcast::dispatch(...)` (termasuk yang salah channel `Display.Room.{roomGroup->id}`), hapus `use`.

### 5. `App\Http\Controllers\Web\DisplayController`
- `index()`: hapus eager-load `media` dari roomGroups & rooms.
- `lobby()`: hapus eager-load `media`; tambah `'media' => Media::globalActive()->get()`.
- `room()`: hapus eager-load `media`; tambah `'media' => Media::globalActive()->get()`.
- `osh()`: tidak berubah.
- Tambah `use App\Models\Media;`.

### 6. `routes/web.php` (dalam group `auth,verified`)
```php
Route::get('infografis', [Web\MediaController::class, 'indexGlobal'])->name('infografis.index');
Route::post('infografis', [Web\MediaController::class, 'storeGlobal'])->name('infografis.store');
Route::post('infografis/reorder', [Web\MediaController::class, 'reorder'])->name('infografis.reorder');
Route::post('infografis/bulk-delete', [Web\MediaController::class, 'bulkDeleteGlobal'])->name('infografis.bulkDelete');
Route::put('infografis/{media}/toggle-active', [Web\MediaController::class, 'toggleActive'])->name('infografis.toggleActive');
Route::delete('infografis/{media}', [Web\MediaController::class, 'destroy'])->name('infografis.destroy');
```
- Route per-entity (`rooms.media.*`, `room-groups.media.*`) DIBIARKAN (dead code).
- `media.chunk` / `media.assemble` tetap.

---

## Realtime (2 event)

### Channel map
| Channel | Event | Subscriber |
|---|---|---|
| `Display.Global` (public) | `MediaUpdated` | Room, Lobby |
| `Display.Osh` | `BookingUpdated` | OSH (sudah ada) |
| `Display.Room.{id}` | `BookingUpdated` | Room (sudah ada) |
| `Display.RoomGroup.{id}` | `BookingUpdated` | Lobby (sudah ada) |

- `BookingUpdated` events sudah benar — tidak diubah.
- `MediaUpdated` global dipancarkan dari `broadcastMediaUpdated` ke `Display.Global`.

### Refetch per display (`router.reload({ only })`)
| Display | BookingUpdated | MediaUpdated | usePoll `only` |
|---|---|---|---|
| Room | `['currentBooking']` | `['media']` | `['currentBooking', 'media']` |
| Lobby | `['bookings']` | `['media']` | `['bookings', 'media']` |
| OSH | `['todayBookings','tomorrowBookings']` (+beep) | — | tidak berubah |

---

## Frontend

### 7. Halaman baru `resources/js/pages/infografis/index.tsx`
```tsx
import { Head } from '@inertiajs/react';
import { MediaManager, type MediaItem } from '@/components/features/media/media-manager';
import { PageContainer } from '@/components/shared/page-container';

type Props = { media: MediaItem[] };

export default function Infografis({ media }: Props) {
    return (
        <PageContainer>
            <Head title="Infografis" />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Infografis</h1>
            </div>
            <MediaManager mediableType="global" mediableId={0} media={media} />
        </PageContainer>
    );
}
```

### 8. `MediaManager` + `MediaUploader` — branch `'global'`
- `MediaManager`: `getRoutes('global')` → `infografis.store()/reorder()/bulkDelete()/toggleActive([id])/destroy([id])` via `@/routes/infografis`. `mediableId` diabaikan untuk global.
- `MediaUploader`:
  - `getStoreUrl('global')` → `infografis.store.url`
  - assemble: `mediable_type: 'global'` (untuk global)
  - fallback reload `only` untuk global → `['media']`
  - type prop: `'rooms' | 'room-groups' | 'global'`

### 9. Sidebar `resources/js/layouts/app-layout/partials/app-sidebar.tsx`
- masterMenu tambah: `{ title: 'Infografis', href: '/infografis', icon: MonitorPlayIcon }` (import lucide).

### 10. Hapus tombol Media di UI per-entity
- `rooms/index.tsx`: hapus prop `onMedia` + block lines 93-95.
- `room-groups/index.tsx`: hapus prop `onMedia` + block lines 96-99.
- `room-data-table.tsx`: hapus prop `onMedia` dari type & destructure, hapus tombol ImageIcon (lines 165-180), hapus `Image as ImageIcon` dari import.
- `room-group-data-table.tsx`: sama (tombol lines 140-148, import `Image as ImageIcon`).

### 11. Display pages
- `display/room.tsx`:
  - Props tambah `media: Media[]`.
  - `MediaPlayer items={media}`.
  - `useEchoPublic('Display.Global', '.MediaUpdated', () => router.reload({ only: ['media'] }))`.
  - `useEchoPublic('Display.Room.'.$room.id, '.BookingUpdated', ...)` → `only: ['currentBooking']`.
  - `usePoll(..., { only: ['currentBooking', 'media'] }, ...)`.
  - hapus `useEchoPublic('Display.Room...', '.MediaUpdated', ...)`.
- `display/lobby.tsx`: sama — `media` top-level, MediaUpdated di `Display.Global` → `['media']`, BookingUpdated → `['bookings']`, usePoll `['bookings', 'media']`, hapus listener MediaUpdated per-group.
- `display/index.tsx`: buang field `media` dari type RoomGroup/Room (kosmetik).

---

## Wayfinder & Tests

### 12. Generate
- `php artisan wayfinder:generate --with-form --no-interaction`

### 13. Test baru `tests/Feature/GlobalMediaTest.php`
- admin dapat membuka `/infografis` (component `infografis/index`).
- admin upload media global → row `mediable_type`/`mediable_id` NULL + broadcast `PublicBroadcast('Display.Global','MediaUpdated')`.
- admin reorder media global → sort_order terupdate.
- admin toggle is_active global.
- admin hapus media global → row hilang + broadcast global.
- assemble dengan `mediable_type: 'global'` → row global + broadcast.
- guest & user biasa ditolak (redirect/403).
- lobby/room display menerima prop `media` berisi media global (active).

### 14. Update test existing
- `DisplayTest.php`:
  - `room display loads media relations` → buat media global (null mediable), assert `has('media', 1)`.
  - `lobby display loads media and rooms for grouping` → media global, assert `has('media', 1)` + `has('roomGroup.rooms', 1)`.
- `BroadcastTest.php`: test `media upload broadcasts media updated to the room channel` tetap lolos (route per-entity masih ada).

### 15. Verifikasi
- `vendor/bin/pint --dirty --format agent`
- `vendor/bin/phpstan analyse --no-progress --memory-limit=1G`
- `php artisan test --compact`
- `npm run types:check` + `npx prettier --check` + `npx eslint` pada file yang diubah
- `php artisan migrate` (aplikasi SQLite lokal)

---

## File yang diubah/dibuat (ringkas)
- M: `database/migrations/2026_08_09_150337_make_media_mediable_nullable.php`
- M: `app/Models/Media.php`
- M: `app/Http/Controllers/Web/MediaController.php`
- M: `app/Http/Controllers/Web/RoomController.php`, `RoomGroupController.php`
- M: `app/Http/Controllers/Web/DisplayController.php`
- M: `routes/web.php`
- A: `resources/js/pages/infografis/index.tsx`
- M: `resources/js/components/features/media/media-manager.tsx`, `media-uploader.tsx`
- M: `resources/js/layouts/app-layout/partials/app-sidebar.tsx`
- M: `resources/js/pages/rooms/index.tsx`, `room-groups/index.tsx`
- M: `resources/js/components/features/room/room-data-table.tsx`, `room-group-data-table.tsx`
- M: `resources/js/pages/display/room.tsx`, `lobby.tsx`, `index.tsx`
- A: `tests/Feature/GlobalMediaTest.php`
- M: `tests/Feature/DisplayTest.php`

TIDAK disentuh: `MediaPolicy`, `MediaPlayer`, `MediaItemList`, `BookingUpdated`, notifikasi personal, OSH display, test per-entity (MediaTest).
