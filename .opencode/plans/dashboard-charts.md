# Plan: Dashboard Charts Reusable (Bar 12 Bulan + Pie All-Time)

## Konteks
Client ingin 4 variasi data statistik ditampilkan di dashboard admin/operator (`dashboard/admin.tsx`), masing-masing dengan 2 variasi tipe chart: **Period Bar Chart (12 bulan kebelakang)** dan **Overall Pie Chart (all-time)**.

Keputusan user:
1. **Skope peserta** (bar bulanan & pie by-room) = hanya booking `approved`.
2. **User paling aktif** & **ruangan paling dipakai** = hanya booking `approved`, **bulanan** (12 bulan, top-3 per window + grouping `Lainnya`) → **max 4 bar per bulan**, mirip bar Acara; pie all-time top-3 + `Lainnya`.
3. **Jendela 12 bulan** = termasuk bulan berjalan (mis. hari ini Agu 2026 → Sep 2025–Agu 2026), **zero-filled** (bulan tanpa data tetap tampil).
4. **Bar "Acara" per bulan** = **grouped** (bukan stacked): `Total`, `Disetujui`, `Ditolak` — karena ada status `pending`, total ≠ approved+rejected.
5. **Pie Acara** = all-time: `Disetujui` / `Ditolak` / `Menunggu`.
6. **Layout** = per variasi data: kiri **80% bar**, kanan **20% pie** → 4 baris.
7. **Bahasa chart** = **Indonesia** (label chart saja, bukan seluruh dashboard).
8. Infrastruktur reusable: komponen `AnnualMonthlyBarChart` & `OverallPieChart` + service pengumpul data.

Catatan: status app = `pending`/`approved`/`rejected` (tidak ada `cancelled`). Library chart `recharts@3.8.0` + shadcn wrapper `resources/js/components/ui/chart.tsx` (`ChartContainer`, `ChartTooltipContent`, `ChartLegendContent`, `ChartConfig`) **sudah terpasang dan belum dipakai**.

---

## Backend

### 1. Service baru `app/Services/DashboardStatistics.php`

Query agregat langsung (tanpa model hydration). Filter rentang bulanan pakai `whereBetween('start_time', [...])` (index `start_time` sudah ada di migration bookings).

| Method | Output |
|---|---|
| `monthlyEvents(int $months = 12)` | `[{ label: 'Sep 25', total, approved, rejected }]` — `total` = semua booking, `approved`/`rejected` = sum per status; **zero-filled** |
| `monthlyParticipants(int $months = 12)` | `[{ label, participants }]` — sum `participants_count` **approved**; **zero-filled** |
| `eventsByStatus()` | `[{ name: 'approved'\|'rejected'\|'pending', value }]` all-time |
| `participantsByRoom(int $top = 3)` | top-3 ruangan + `Lainnya` (sum peserta **approved** per ruangan) |
| `topUsers(int $top = 3)` | `[{ name, value }]` — jumlah booking **approved** per user |
| `usersShare(int $top = 3)` | `topUsers` + `Lainnya` |
| `topRooms(int $top = 3)` | `[{ name, value }]` — jumlah booking **approved** per ruangan |
| `roomsShare(int $top = 3)` | `topRooms` + `Lainnya` |
| `monthlyUsers(int $months = 12, int $top = 3)` | `[{ label, <nama user>: n, ..., Lainnya: n }]` — top-3 user (dalam window) + sisa, per bulan; **zero-filled** |
| `monthlyRooms(int $months = 12, int $top = 3)` | `[{ label, <nama ruangan>: n, ..., Lainnya: n }]` — top-3 ruangan (dalam window) + sisa, per bulan; **zero-filled** |

Helper internal:
- `monthBuckets(int $months, ?Carbon $end = null): array` — daftar bucket `['key' => 'Y-m', 'label' => 'MMM YY']` dari bulan berjalan mundur $months-1; lalu merge hasil query `DATE_FORMAT(start_time, '%Y-%m')` + zero-fill.
- `withOthers(Collection $rows, int $top): array` — sort desc, ambil top-N, jumlahkan sisa → `['name' => 'Lainnya', 'value' => rest]`.
- `fillNamedMonths(array $buckets, Collection $rows, array $names, string $othersLabel)` — zero-fill per bulan untuk top-N user/ruangan + `Lainnya`.
- `monthlyTopNames(string $foreignKey, string $table, CarbonImmutable $from, CarbonImmutable $to, int $top)` — resolusi top-N nama dalam window (approved-only).

### 2. `app/Http/Controllers/Web/DashboardController.php` — `admin()`
Inject `app(DashboardStatistics::class)`; tambah prop `statistics` (di samping props existing):
```php
'statistics' => [
    'eventsMonthly'       => $stats->monthlyEvents(),
    'participantsMonthly' => $stats->monthlyParticipants(),
    'eventsByStatus'      => $stats->eventsByStatus(),
    'participantsByRoom'  => $stats->participantsByRoom(),
    'usersMonthly'        => $stats->monthlyUsers(),
    'usersShare'          => $stats->usersShare(),
    'roomsMonthly'        => $stats->monthlyRooms(),
    'roomsShare'          => $stats->roomsShare(),
],
```

---

## Frontend

### 3. `resources/js/lib/chart.ts` (baru)
- `CHART_PALETTE` — palet warna oklch dengan `theme: { light, dark }` (untuk `ChartConfig` shadcn).
- `STATUS_CONFIG` — `approved: { label: 'Disetujui', color: green }`, `rejected: { label: 'Ditolak', color: red }`, `pending: { label: 'Menunggu', color: amber }`.
- `chartConfig(series): ChartConfig` — helper membangun config untuk `ChartContainer`.
- `valueFormatter` — `Intl.NumberFormat('id-ID')` (ribuan).
- `monthLabel` bila perlu (backend sudah kirim `label`).

### 4. Komponen reusable (baru, `resources/js/components/features/dashboard/`)
- **`chart-card.tsx`** — `{ title, description?, action?, children, className? }`: `Card` + `CardHeader` + `CardContent`.
- **`annual-monthly-bar-chart.tsx`** — `AnnualMonthlyBarChart`:
  ```
  { title, description?, data: Array<Record<string, string|number>>,
    series: Array<{ key: string; label: string; color?: string }>,
    stacked? = false, valueFormatter?, className? }
  ```
  Render `ChartContainer` + `BarChart`: `XAxis dataKey="label"`, `YAxis`, `CartesianGrid`, `ChartTooltip` + `ChartTooltipContent`, `ChartLegend` + `ChartLegendContent`, satu `<Bar>` per `series`. Bulan kosong (nilai 0) tetap tampil.
- **`overall-pie-chart.tsx`** — `OverallPieChart`:
  ```
  { title, description?, data: Array<{ name: string; value: number }>,
    valueFormatter?, className? }
  ```
  Render `ChartContainer` + `PieChart` + `Pie dataKey="value" nameKey="name"` + `<Cell>` berwarna dari palette + tooltip + legend.

### 5. `resources/js/pages/dashboard/admin.tsx`
- Tambah tipe `statistics` (8 dataset) + destructure.
- Render seksi **"Statistik"** setelah kartu stats & sebelum pending approvals. 4 baris, tiap baris:
  `grid grid-cols-1 gap-4 lg:grid-cols-5` → bar `lg:col-span-4`, pie `lg:col-span-1`.
  1. **Acara** — bar bulanan (Total/Disetujui/Ditolak, grouped) + pie status.
  2. **Peserta** — bar bulanan + pie by ruangan (top-3 + Lainnya).
  3. **User paling aktif** — bar bulanan (top-3 + Lainnya, max 4 bar/bulan) + pie share.
  4. **Ruangan** — bar bulanan (top-3 + Lainnya, max 4 bar/bulan) + pie share.

  Bar User/Ruang: key = nama user/ruangan (dapat mengandung spasi) → komponen bar chart mengisi `fill` langsung dari warna series (bukan `var(--color-...)`) agar nama dengan spasi tidak merusak CSS var. Series di-derive dari key baris data bulanan pertama via `seriesFromRows()`.

---

## Wayfinder & Tests

### 6. Wayfinder
Tidak ada route baru → `php artisan wayfinder:generate` TIDAK perlu dijalankan.

### 7. Test baru/perluasan `tests/Feature/AdminDashboardTest.php`
- **Zero-fill**: buat booking hanya bulan ini → `statistics.eventsMonthly` tetap 12 item, bulan lain bernilai 0.
- **`monthlyEvents`**: booking lintas status di satu bulan → `total`/`approved`/`rejected` benar.
- **`monthlyParticipants`**: hanya booking `approved` yang dihitung (pending/rejected = 0).
- **`eventsByStatus`**: counts all-time per status.
- **`participantsByRoom`**: 4 ruangan → top-3 + `Lainnya` (approved-only).
- **`topUsers`** / **`topRooms`**: 3 teratas, approved-only; `usersShare`/`roomsShare` = top-3 + `Lainnya`.
- **`monthlyUsers`** / **`monthlyRooms`**: 12 bulan, top-3 dalam window + `Lainnya`, distribusi antar bulan benar, set key konsisten di semua bulan.
- **AdminDashboardTest lama** (`admin dashboard returns correct stats`) diperluas dengan `->has('statistics.eventsMonthly')` dll.

### 8. Verifikasi
- `vendor/bin/pint --dirty --format agent`
- `vendor/bin/phpstan analyse --no-progress --memory-limit=1G`
- `php artisan test --compact`
- `npm run types:check`
- `npx eslint` + `npx prettier --check` pada file frontend yang diubah
- `npm run build:ssr` — pastikan recharts aman di SSR (shadcn `ChartContainer` sudah support `initialDimension`)

---

## File yang diubah/dibuat (ringkas)
- A: `app/Services/DashboardStatistics.php`
- M: `app/Http/Controllers/Web/DashboardController.php`
- A: `resources/js/lib/chart.ts`
- A: `resources/js/components/features/dashboard/chart-card.tsx`
- A: `resources/js/components/features/dashboard/annual-monthly-bar-chart.tsx`
- A: `resources/js/components/features/dashboard/overall-pie-chart.tsx`
- M: `resources/js/pages/dashboard/admin.tsx`
- M: `tests/Feature/AdminDashboardTest.php`

TIDAK disentuh: user dashboard (`dashboard/index.tsx`), route baru, dependency (recharts/shadcn sudah ada), bahasa UI dashboard selain label chart.
