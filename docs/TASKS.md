# Task List — MeetingSpace

Status: `todo` · `in_progress` · `done`

---

## Phase 10: Dummy Seeder

> Seed data realistis untuk review UI. `php artisan db:seed` hanya users, `--class=DummySeeder` semua data.

### DatabaseSeeder (users only)

- [x] Simplify `DatabaseSeeder` — upsert 3 users (admin/operator/user) via `updateOrCreate` agar tidak redundant saat dijalankan berulang

### DummySeeder (master + transaksi)

- [x] Create `DummySeeder` — dijalankan via `php artisan db:seed --class=DummySeeder`

#### Master Data (upsert, idempotent)

- [x] Upsert 4 people (event leaders) — 3 active (+ photo), 1 inactive — pakai `name` sebagai unique key
- [x] Upsert 3 OSH levels (low/mid/high) — pakai `name` sebagai unique key
- [x] Upsert 2 buildings — pakai `name` sebagai unique key
- [x] Upsert 3 room groups — pakai `name` sebagai unique key
- [x] Upsert 5 rooms + pivot `room_room_group` — pakai `name` sebagai unique key

#### Booking Data (~32 bookings, -7 to +7 days)

- [x] Today (6): 2 approved (in progress), 1 pending, 1 rejected, 1 cancelled, 1 approved (upcoming)
- [x] Tomorrow (5): 3 approved, 1 pending, 1 rejected
- [x] Past D-7 to D-1 (12): 9 approved, 2 rejected, 1 cancelled
- [x] Future D+2 to D+8 (9): 5 approved, 4 pending
- [x] Varying participants (5, 15, 25, 45, 55) → all 3 OSH levels
- [x] Attach 3 PDFs ke beberapa bookings
- [x] Set `approved_id` + `approved_at` untuk approved bookings
- [x] Set `reason` untuk rejected bookings

#### Media Data (8 orphaned files)

- [x] Link 6 files ke room groups (2-3 per group) — images + videos untuk lobby display
- [x] Link 2 files ke rooms (1 per room) — images untuk room display
- [x] Set proper `type`, `mime`, `sort_order`, `is_active`, `name`

#### Notification Data

- [x] Seed 5 notifications (3 admin unread, 1 operator unread, 1 user read)

### Verify

- [x] Run `php artisan migrate:fresh && php artisan db:seed` → 3 users only
- [x] Run `php artisan db:seed --class=DummySeeder` → full data, idempotent on re-run
- [ ] Admin dashboard shows real stats, user dashboard shows upcoming bookings
- [ ] Display pages render today's bookings with media

---

## Phase 11: Improve UI

> Both dashboards are hardcoded stubs with em-dashes. Build real data-driven pages.

### Admin Dashboard

- [ ] Update `DashboardController` (or `BookingController`) to pass real stats: total buildings, total rooms, pending bookings count, total users, recent 5 bookings
- [ ] Update `dashboard.tsx` — replace hardcoded em-dashes with live stats from Inertia props
- [ ] Show pending approval queue (5 most recent pending bookings with quick approve/reject)
- [ ] Show recent activity (5 most recent bookings with status badges)
- [ ] Write feature test: admin dashboard returns correct stats

### User Dashboard

- [ ] Update `DashboardController` or create `DashboardController` to pass user-specific data: upcoming approved bookings count, next 3 upcoming bookings, total rooms available
- [ ] Update `dashboard.tsx` — replace hardcoded zeros with live data
- [ ] Add quick link to booking create form
- [ ] Write feature test: user dashboard returns correct data

### Responsive Polish

- [ ] Audit admin/operator sidebar on mobile — ensure sidebar collapses, tables scroll horizontally, modals are full-width on small screens
- [ ] Audit user dashboard on mobile — ensure cards stack, text is readable, quick book button is accessible

### Display Refresh Fix

- [ ] Fix all 3 display pages (lobby, room, osh) — remove simultaneous polling+WebSocket, use WebSocket as primary with polling fallback only when Echo disconnects
- [ ] Verify: when WebSocket connected, no polling requests are made; when WebSocket disconnects, polling activates automatically

---

## Phase 12: UAT (User Acceptance Testing)

> Run end-to-end scenarios manually. Each scenario is a checklist item.

### Scenario: Admin Full Flow

- [ ] Login as admin → dashboard shows real stats
- [ ] CRUD buildings (create, edit, delete)
- [ ] CRUD room groups (create with room assignment, edit, delete)
- [ ] CRUD rooms (create with capacity, edit, delete)
- [ ] CRUD event leaders (create with photo, edit, delete)
- [ ] CRUD OSH levels (create with color, edit, delete, reorder)
- [ ] Upload media to a room → appears in media manager
- [ ] Upload media to a room group → appears in media manager
- [ ] View bookings list → search, filter by status, sort, paginate
- [ ] Approve a pending booking → user receives notification
- [ ] Reject a pending booking with reason → user receives notification
- [ ] Delete a booking → removed from list
- [ ] Manage users (create, edit role, delete)
- [ ] Update general settings (advance hours, auto-approve toggle)
- [ ] View lobby display → shows today's schedule + media
- [ ] View room display → shows current event or media slideshow
- [ ] View OSH display → shows today/tomorrow events with color badges

### Scenario: Operator Flow

- [ ] Login as operator → redirected to admin panel
- [ ] Can view/approve/reject bookings
- [ ] Can CRUD buildings, rooms, room groups, people, OSH levels
- [ ] Cannot manage users (403 on user routes)

### Scenario: User Flow

- [ ] Login as user → redirected to user dashboard
- [ ] Dashboard shows upcoming bookings
- [ ] Create a booking (fill form, upload PDF, submit)
- [ ] View own bookings list → search, sort, paginate
- [ ] View booking detail → see status, OSH level
- [ ] Cancel a pending/upcoming booking (if within cancellation window)
- [ ] Receive notification when booking is approved/rejected

### Scenario: Display Kiosk

- [ ] Open lobby display URL (no auth required) → renders schedule + media
- [ ] Open room display URL → shows current event info or idle media
- [ ] Open OSH display URL → shows today/tomorrow tables with color badges
- [ ] WebSocket push works (booking change instantly reflected on display)
- [ ] Polling fallback activates only when WebSocket disconnects (not both simultaneously)

---

## Phase 13: Polish

> Fix issues found during UAT + final cleanup.

- [ ] Fix any UI bugs discovered during UAT
- [ ] Fix any data inconsistencies found during UAT
- [ ] Add rate limiting to booking creation endpoint
- [ ] Run `vendor/bin/pint --dirty --format agent`
- [ ] Run `php artisan test --compact` — all tests pass
- [ ] Run `npm run build` — frontend builds without errors
- [ ] Final `composer run ci:check` — all lint, type, and test checks pass
