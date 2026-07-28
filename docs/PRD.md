# Product Requirements Document: MeetingSpace - Real-Time Meeting Room Management App

## Problem Statement

Small to medium businesses often struggle with managing meeting room bookings and ensuring that room availability is up-to-date. Additionally, there is a need for real-time information displays in lobbies and meeting rooms to provide clear and dynamic updates to users. Current solutions are either too complex, lack real-time updates, or do not integrate well with existing systems.

## User Journeys

### As Public (Unauthenticated)

1. Visit landing page / home
2. Choose: **Dashboard Panel** (login required) or **Display Panel** (public)

### As IT Staff (Display Setup)

1. View all available displays with variants
2. Pick a display item + choose orientation (landscape / portrait)
3. Launch display — full-screen kiosk, no auth required

### As User / Operator / Admin

1. Choose CTA panel option (e.g., "Book a Room", "Manage Bookings")
2. Login (passkey)
3. Land on role-appropriate dashboard:
   - **User** → user dashboard (upcoming bookings, quick book)
   - **Operator/Admin** → admin dashboard (stats, pending approvals, recent activity)

## Goals & Success Metrics

### Goals

1. **User-Friendly Booking System**: Create an intuitive and easy-to-use interface for booking and managing meeting rooms.
2. **Real-Time Information Displays**: Three distinct display types (Lobby, Room, OSH) for different contexts — each with tailored content and real-time updates.
3. **Role-Based Access Control**: Implement distinct user roles (admin, operator, user) to manage permissions and responsibilities.
4. **Media Management**: Support per-room and per-room-grouping media (video, photo, PDF) with looping playback on displays.
5. **Master Data**: Maintain structured master data for event leaders (pimpinan acara) and OSH levels/statuses.

### Success Metrics

1. **User Adoption**: Achieve a 90% adoption rate among target businesses within the first 6 months.
2. **User Satisfaction**: Maintain a user satisfaction score of 85% or higher based on regular feedback surveys.
3. **System Reliability**: Ensure 99.9% uptime and real-time data accuracy.

## User Stories

1. **As an Admin**: I want to manage user roles, permissions, room groupings, rooms, and master data so that I can control the entire system.
2. **As an Admin**: I want to manage media uploads for each room and room grouping so that displays show the right content.
3. **As an Admin**: I want to approve, reject, or reschedule booking requests (with overlap validation) so that room availability is managed properly.
4. **As an Operator**: I want to approve or reject booking requests and manage people so that operations run smoothly.
4. **As a User**: I want to book a meeting room easily and view its availability in real-time so that I can plan my meetings efficiently.
5. **As a Visitor**: I want to see the Lobby Display in the lobby showing today's schedule and looping media so that I know where to go.
6. **As a Meeting Organizer**: I want the Room Display to show my current event info, or loop media when the room is idle.
7. **As a Safety Officer**: I want the OSH Display to show today's and tomorrow's events with auto-assigned OSH levels so I can prepare the appropriate security and safety measures for each event.
8. **As a User**: I want to receive in-app notifications about booking approvals and rejections so I know the status of my requests.

## Functional Requirements

### 1. User Authentication and Role Management

- Login via passkey only (WebAuthn). No registration, no password reset, no email verification.
- Role-based access control for admin, operator, and user roles.
- **Role-based dashboards**: admin/operator see management dashboard; regular users see a simpler user dashboard.
- Admin can add, edit, and delete users.

### 1a. General Settings (Admin)

- Admin panel for system-wide configuration.
- **Booking window**: `booking_advance_hours` — bookings can only be created N hours before event start time.
- **Booking horizon**: `booking_max_days_ahead` — maximum days in the future a user can book.
- **Cancellation window**: `cancellation_hours` — currently unused. Reserved for potential future use.
- **Auto-approve bookings**: toggle to auto-approve all bookings without operator review.
- **Default OSH level**: replaced by automatic fallback — the OSH level with the largest participant range serves as default.
- **Display refresh interval**: seconds between display auto-refresh (default: 30).
- **Media loop duration**: seconds each media item displays before advancing (default: 10 for images, full duration for video).
- Settings stored in `settings` table, editable via admin UI. Under review — some settings may be adjusted based on operational needs.

### 2. Master Data Management

#### 2a. Event Leaders (Pimpinan Acara)

- Admin can CRUD event leaders (name, photo, is_active).
- Each booking references an event leader.
- Event leader is displayed on Room Display and OSH Display.

#### 2b. OSH Levels/Statuses

- Admin can CRUD OSH levels/statuses (e.g., "Low", "Mid", "High" with color picker and sort order).
- Each level has a `min_participants` and `max_participants` range to auto-determine which level applies.
- Color is chosen via color picker (hex value stored).
- When a user books, they fill in `participants_count`. The system **automatically assigns** the matching OSH level based on this count.
- **Fallback**: if no range matches, the level with the **largest participant range** is used as default. OSH level assignment is **mandatory** for every booking.
- OSH level is used by the **Security & Order team (Tim Keamanan & Ketertiban)** to prepare event needs (equipment, personnel, access control).
- OSH level is displayed on OSH Display and affects status color on Room Display.

### 3. Building, Room Grouping & Room Management

- Admin manages buildings, room groupings (clusters/zones of rooms), and rooms.
- A **Room Grouping** is a logical group of rooms displayed together on a Lobby Display (e.g., "Floor 3 — Executive Wing").
- Each Room Grouping belongs to a Building.
- Rooms are associated with Room Groupings via many-to-many relationship.
- Each Room has: name, capacity, building association, is_active.

### 4. Media Management

- Each **Room** and **Room Grouping** has a media library.
- Supported media types: image (jpg, png, webp), video (mp4, webm), document (PDF — displayed as slideshow pages).
- Media items have: file, name (optional), type, size, mime, sort_order, is_active flag.
- **Chunk upload** for large files (video, large PDF) — frontend splits file into chunks, backend reassembles.
- Media is uploaded via admin panel and stored on local disk.
- Displays pull active media and **autoplay + loop** them continuously.
- **Real-time sync**: when media is uploaded, deleted, reordered, or toggled on displays, connected display screens update automatically via WebSocket.

### 5. Meeting Room Booking System

- User-friendly interface for booking meeting rooms.
- Each booking references: room, event leader, title, description, start/end time, **participants_count**.
- **participants_count** determines the OSH level automatically (system-calculated based on participant count ranges, not user-selected).
- Real-time availability status.
- Booking requests that require operator approval (unless auto-approve is enabled).
- **No user-initiated cancellation or rescheduling.**
- **Admin can reschedule** a booking to a new time slot, subject to overlap validation (must not conflict with existing approved bookings for the same room).
- **Operator** can approve or reject bookings but cannot reschedule.

### 6. Display System — Three Display Types

Each display supports **two layout orientations**: **portrait** (vertical monitor) and **landscape** (horizontal monitor). Layout is configurable per display instance. Media content **autoplays and loops** continuously on all display types.

#### 6a. Lobby Display (Room Grouping Display)

- Shows all rooms in a room grouping.
- **Media section**: autoplays and loops through the room grouping's media (video, photo, PDF slideshow).
- **Schedule section**: lists today's bookings for all rooms in the grouping (time, room name, event title, event leader).
- Available in **portrait** and **landscape** layout variants.
- Real-time updates when bookings change (via WebSocket).
- No authentication required (kiosk mode).

#### 6b. Room Display

- Shows a single room's status.
- **If an event is in progress**: displays event title, event leader, OSH level, start/end time, next event info.
- **If room is idle**: autoplays and loops through the room's media (video, photo, PDF slideshow).
- Available in **portrait** and **landscape** layout variants.
- Real-time status updates (via WebSocket).
- No authentication required (kiosk mode).

#### 6c. OSH Display (Occupational Safety and Health)

- Shows two tables side-by-side or stacked:
  - **Today's events**: all approved bookings for today (room, time, event title, event leader, participants count, OSH level with color).
  - **Tomorrow's events**: all approved bookings for tomorrow (same columns).
- OSH level is auto-assigned based on participants_count; shown with color coding (Low=green, Mid=yellow, High=red).
- **Audio indicator**: plays sound when new approved events appear.
- Purpose: helps **Security & Order team** prepare equipment, personnel, and access control per event.
- Available in **portrait** and **landscape** layout variants.
- Real-time updates (via WebSocket).
- No authentication required (kiosk mode).

### 7. Notifications

- **In-app (database) notifications only.** No email, no push notifications.
- Notification types:
  - Booking submission → notifies all admin and operator users.
  - Booking approval → notifies requesting user.
  - Booking rejection (with reason) → notifies requesting user.
- **Audio notification**: plays sound when new notification arrives (client-side, toggleable mute/unmute).
- Real-time delivery via WebSocket (Reverb).

## Non-Functional Requirements

1. **Performance**
   - The app should handle up to 100 simultaneous users without performance degradation.
   - Real-time updates should occur within 2 seconds of a change.
   - Media files should be optimized/compressed on upload.
   - Displays should gracefully handle network interruptions with cached last-known state.

2. **Security**
   - Secure user authentication and data transmission using industry-standard protocols.
   - Display endpoints are public but read-only.
   - Regular security audits and updates.

3. **Scalability**
   - The system should be scalable to support future growth and additional features.
   - Ability to add new buildings, room groupings, rooms, and displays easily.

4. **Usability**
   - Intuitive and user-friendly interface.
   - Mobile-responsive design for admin/operator panels.
   - Displays are full-screen and optimized for large monitors/TVs.

5. **Reliability**
   - 99.9% uptime.
   - Automatic failover and redundancy for critical components.
