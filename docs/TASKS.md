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

---

## Phase 11: Dashboards (Role-Based)

> Dashboards exist but need real data. Content varies by role.

### Admin Dashboard

- [x] Create `AdminDashboardController` (or extend `DashboardController`) — pass: totalBuildings, totalRooms, pendingBookingsCount, totalUsers, recent 5 bookings
- [x] Wire admin dashboard route
- [x] Update `admin/dashboard.tsx` — replace hardcoded stubs with Inertia props
- [x] Show pending approval queue (5 most recent pending bookings with quick approve/reject)
- [x] Show recent activity (5 most recent bookings with status badges)
- [x] Write feature test: admin dashboard returns correct stats

### User Dashboard

- [x] Update `DashboardController` — pass user-specific data: upcoming approved bookings count, next 3 upcoming bookings, total rooms available
- [x] Update `dashboard.tsx` — show role-appropriate content (admin/operator → admin panel; user → user dashboard)
- [x] Add quick link to booking create form
- [x] Write feature test: user dashboard returns correct data

### Responsive Polish

- [ ] Audit admin/operator sidebar on mobile — ensure sidebar collapses, tables scroll horizontally, modals are full-width on small screens
- [ ] Audit user dashboard on mobile — ensure cards stack, text is readable, quick book button is accessible

---

## Phase 12: Notifications + Real-Time

> In-app notification system with audio + WebSocket real-time delivery.

### 12a: Backend — Broadcasting on All Booking Lifecycle Events

> Currently only update/approve/reject broadcast. Store and destroy don't.

- [x] Add `broadcast(new BookingUpdated($booking))` to `BookingController::store()` — after creation (including auto-approved)
- [x] Create `BookingDeleted` event (or reuse `BookingUpdated` with action type) — broadcast on `BookingController::destroy()`
- [x] Verify `BookingUpdated` event data includes all fields needed by frontend (booking id, title, room, status, time, OSH level, event leader)
- [x] Create `MediaUpdated` event — broadcast when media is uploaded, deleted, reordered, or toggled
- [x] Broadcast `MediaUpdated` to `room.{room_id}` and `room-group.{group_id}` channels
- [x] Ensure `BookingCreated`, `BookingApproved`, `BookingRejected` notifications are dispatched in correct controller methods

### 12b: Backend — Notification CRUD

> `NotificationController` is currently entirely stubbed (all methods empty).

- [x] Implement `NotificationController::index()` — return paginated notifications for authenticated user
- [x] Implement `NotificationController::show()` — mark as read, return data
- [x] Implement `NotificationController::markAsRead()` — mark single notification read
- [x] Implement `NotificationController::markAllAsRead()` — mark all as read
- [x] Implement `NotificationController::clearAll()` — delete all user's notifications
- [x] Add route `GET /notifications/unread-count` — return count
- [x] Add route `PATCH /notifications/{notification}/read` — mark single as read
- [x] Write tests for all notification endpoints

### 12c: Frontend — Notification Bell + Audio

- [x] Move `notification-bell.tsx` from `--old/` layout to active layout
- [x] Subscribe to `bookings` channel for `booking.updated` events
- [x] Add audio playback: `new Audio('/audio/notification.mp3').play()` on event received
- [ ] Add mute/unmute toggle (localStorage preference)
- [x] Create `notifications/index.tsx` — list page with read/unread states, mark all button, clear button
- [x] Wire notification bell unread count to real API endpoint
- [x] Badge count updates in real-time via Echo

### 12d: Notification Sound

- [x] Add notification sound file at `public/audio/notification.mp3`
- [x] Confirm existing `public/audio/beep.wav` — reuse or replace

---

## Phase 13: Display System

> Three public display types. No auth. Real-time updates via WebSocket + polling fallback.

### 13a: Backend — DisplayController

- [x] Implement `DisplayController::index()` — list all displayable items (room groups, rooms) for IT staff to pick
- [x] Implement `DisplayController::show()` — route `/display/{type}/{id?}` where type = `lobby|room|osh`
- [x] Lobby endpoint: return room group + its rooms + today's approved bookings + active media
- [x] Room endpoint: return room + current/upcoming bookings + active media + refresh interval
- [x] OSH endpoint: return today + tomorrow approved bookings with OSH level + color
- [x] Ensure endpoints are outside auth middleware (already the case)
- [x] Write tests: each display type returns correct data structure

### 13b: Frontend — Display Pages

#### Lobby Display (`display/group-display.tsx`)

- [x] Show room grouping name + all rooms in the group
- [x] Media section: autoplay + loop through room group's active media (images, videos, PDFs as slideshow)
- [x] Schedule section: today's bookings for all rooms (time, room name, event title, event leader)
- [x] Subscribe to `room-group.{id}` channel — refresh schedule on `booking.updated`
- [x] Subscribe to `room-group.{id}` channel — refresh media on `media.updated`
- [x] Auto-refresh polling fallback (interval from `GeneralSettings.display_refresh_interval`)

#### Room Display (`display/room-display.tsx`)

- [x] If event in progress: show event title, event leader, OSH level (color badge), start/end time, next event
- [x] If room idle: autoplay + loop through room's active media
- [x] Subscribe to `room.{id}` channel — refresh on `booking.updated`
- [x] Subscribe to `room.{id}` channel — refresh media on `media.updated`
- [x] Auto-refresh polling fallback

#### OSH Display (`display/osh-display.tsx`)

- [x] Two tables: today's events + tomorrow's events
- [x] Columns: room, time, event title, event leader, participants count, OSH level (color badge)
- [x] Subscribe to `bookings` channel — refresh on `booking.updated`
- [x] **Audio indicator**: play sound when new approved event appears
- [x] Auto-refresh polling fallback

### 13c: Display Layouts (Portrait + Landscape)

- [x] Each display type supports portrait and landscape orientations
- [x] Orientation from cookie (`display_orientation`) or query param
- [x] Tailwind responsive classes or separate layout components
- [x] Full-screen kiosk mode (no browser chrome)

### 13d: Display Launch Flow (IT Staff)

- [x] Create display index page at `/display` — list all room groups, rooms with thumbnail
- [x] Pick a display + choose orientation (landscape/portrait) → opens in full-screen
- [x] URL pattern: `/display/lobby/{roomGroupId}?orientation=landscape`

---

## Phase 14: UAT (User Acceptance Testing)

> Run end-to-end scenarios manually. Each scenario is a checklist item.

### Scenario: Admin Full Flow

- [x] Login as admin → dashboard shows real stats
- [x] CRUD buildings (create, edit, delete)
- [x] CRUD room groups (create with room assignment, edit, delete)
- [x] CRUD rooms (create with capacity, edit, delete)
- [x] CRUD event leaders (create with photo, edit, delete)
- [x] CRUD OSH levels (create with color, edit, delete, reorder)
- [x] Upload media to a room → appears in media manager
- [x] Upload media to a room group → appears in media manager
- [x] View bookings list → search, filter by status, sort, paginate
- [x] Approve a pending booking → user receives in-app notification
- [x] Reject a pending booking with reason → user receives in-app notification
- [ ] Reschedule a booking → overlap validation enforced
- [ ] Delete a booking → removed from list
- [ ] Manage users (create, edit role, delete)
- [ ] Update general settings (advance hours, auto-approve toggle)

### Scenario: Operator Flow

- [ ] Login as operator → redirected to management dashboard
- [ ] Can view/approve/reject bookings
- [ ] Cannot reschedule a booking (with overlap validation)
- [ ] Can CRUD people only
- [ ] Cannot manage buildings, rooms, room groups, OSH levels (admin only)
- [ ] Cannot manage users (403 on user routes)

### Scenario: User Flow

- [ ] Login as user → redirected to user dashboard
- [ ] Dashboard shows upcoming bookings
- [ ] Create a booking (fill form, upload PDF, submit)
- [ ] View own bookings list → search, sort, paginate
- [ ] View booking detail → see status, OSH level
- [x] Receive in-app notification when booking is approved/rejected
- [ ] Cannot cancel or reschedule own bookings (no UI option)

### Scenario: Notifications

- [x] When user creates booking → all admin/operator receive in-app notification + audio
- [x] When booking approved/rejected → requesting user receives in-app notification + audio
- [x] Notification bell shows unread count badge
- [ ] Click notification → mark as read
- [ ] Mark all as read → clears badge
- [ ] Clear all notifications → removes all

### Scenario: Display Kiosk

- [ ] IT staff can browse display list, pick orientation, launch display
- [ ] Open lobby display URL (no auth) → renders schedule + media
- [ ] Open room display URL → shows current event info or idle media
- [ ] Open OSH display URL → shows today/tomorrow tables with color badges + audio on new events
- [ ] WebSocket push works (booking change instantly reflected on display)
- [ ] Media change on display → display updates in real-time
- [ ] Polling fallback activates only when WebSocket disconnects

---

## Phase 15: Polish

> Fix issues found during UAT + final cleanup.

- [ ] Fix any UI bugs discovered during UAT
- [ ] Fix any data inconsistencies found during UAT
- [x] Add rate limiting to booking creation endpoint
- [x] Fix `.env.example` — add missing `REVERB_*` vars
- [x] Remove duplicate `BROADCAST_CONNECTION` in `.env`
- [x] Run `vendor/bin/pint --dirty --format agent`
- [x] Run `php artisan test --compact` — all tests pass
- [x] Run `npm run build` — frontend builds without errors
- [x] Final `composer run ci:check` — all lint, type, and test checks pass

---

## Phase 16: Service Monitoring

> Monitoring page untuk service backend yang berjalan di production (queue worker + Reverb).

- [x] Create service monitoring page (admin only) — status queue worker & Reverb
- [x] Queue status: connected/active, job count, pending vs failed_jobs count, worker process alive check
- [x] Reverb status: server up/down, connected clients count, uptime
- [x] Show on dashboard or dedicated page with refresh interval (manual + auto)
- [x] Write feature test: only admin can access monitoring page
- [x] Queue actions (admin only): clear pending jobs, retry/flush failed jobs, start/stop queue worker
- [x] Write feature test: only admin can run monitoring queue actions
- [x] Reverb actions (admin only): start/stop Reverb server process (PID tracked)
- [x] Write feature test: only admin can run monitoring Reverb actions
