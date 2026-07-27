# Product Requirements Document: MeetingSpace - Real-Time Meeting Room Management App

## Problem Statement

Small to medium businesses often struggle with managing meeting room bookings and ensuring that room availability is up-to-date. Additionally, there is a need for real-time information displays in lobbies and meeting rooms to provide clear and dynamic updates to users. Current solutions are either too complex, lack real-time updates, or do not integrate well with existing systems.

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
4. **Integration**: Successfully integrate with at least 3 major calendar and scheduling tools (e.g., Google Calendar, Outlook, Apple Calendar).

## User Stories

1. **As an Admin**: I want to manage user roles, permissions, room groupings, rooms, and master data so that I can control the entire system.
2. **As an Admin**: I want to manage media uploads for each room and room grouping so that displays show the right content.
3. **As an Operator**: I want to view and manage booking requests to ensure that all bookings are approved or denied in a timely manner.
4. **As a User**: I want to book a meeting room easily and view its availability in real-time so that I can plan my meetings efficiently.
5. **As a Visitor**: I want to see the Lobby Display in the lobby showing today's schedule and looping media so that I know where to go.
6. **As a Meeting Organizer**: I want the Room Display to show my current event info, or loop media when the room is idle.
7. **As a Safety Officer**: I want the OSH Display to show today's and tomorrow's events with auto-assigned OSH levels so I can prepare the appropriate security and safety measures for each event.
8. **As a User**: I want to receive notifications about booking confirmations and cancellations to stay informed.

## Functional Requirements

### 1. User Authentication and Role Management

- User registration and login.
- Role-based access control for admin, operator, and user roles.
- **Separate dashboards**: admin/operator share a management panel (`/admin/*`), regular users get a simpler user dashboard (`/dashboard`).
- Admin can add, edit, and delete users and roles.

### 1a. General Settings (Admin)

- Admin panel for system-wide configuration.
- **Booking window**: `booking_advance_hours` — bookings can only be created N hours before event start time (e.g., 24 means user must book at least 24 hours in advance).
- **Booking horizon**: `booking_max_days_ahead` — maximum days in the future a user can book (e.g., 30).
- **Cancellation window**: `cancellation_hours` — bookings can only be cancelled N hours before event start time.
- **Auto-approve bookings**: toggle to auto-approve all bookings without operator review.
- **Default OSH level**: fallback OSH level when participants_count doesn't match any range.
- **Display refresh interval**: seconds between display auto-refresh (default: 30).
- **Media loop duration**: seconds each media item displays before advancing (default: 10 for images, full duration for video).
- Settings stored in `settings` table, editable via admin UI.

### 2. Master Data Management

#### 2a. Event Leaders (Pimpinan Acara)

- Admin can CRUD event leaders (name, title/position, photo, contact info).
- Each booking references an event leader.
- Event leader is displayed on Room Display and OSH Display.

#### 2b. OSH Levels/Statuses

- Admin can CRUD OSH levels/statuses (e.g., "Low", "Mid", "High" with color picker and sort order).
- Each level has a `min_participants` and `max_participants` range to auto-determine which level applies.
- Color is chosen via color picker (hex value stored).
- When a user books, they fill in `participants_count`. The system **automatically assigns** the matching OSH level based on this count.
- OSH level is used by the **Security & Order team (Tim Keamanan & Ketertiban)** to prepare event needs (equipment, personnel, access control).
- OSH level is displayed on OSH Display and affects status color on Room Display.

### 3. Building, Room Grouping & Room Management

- Admin manages buildings, room groupings (clusters/zones of rooms), and rooms.
- A **Room Grouping** is a logical group of rooms displayed together on a Lobby Display (e.g., "Floor 3 — Executive Wing").
- Each Room Grouping belongs to a Building.
- Each Room belongs to a Room Grouping.
- Each Room has: name, capacity, description, amenities (JSON), status, and image.

### 4. Media Management

- Each **Room** and **Room Grouping** has a media library.
- Supported media types: image (jpg, png, webp), video (mp4, webm), document (PDF — displayed as slideshow pages).
- Media items have: file, title (optional), sort_order, is_active flag.
- **Chunk upload** for large files (video, large PDF) — frontend splits file into chunks, backend reassembles. Supports resume on failure.
- Media is uploaded via admin panel and stored on local/S3 disk.
- Displays pull active media and **autoplay + loop** them continuously.

### 5. Meeting Room Booking System

- User-friendly interface for booking meeting rooms.
- Each booking references: room, event leader, title, description, start/end time, **participants_count**.
- **participants_count** determines the OSH level automatically (system-calculated based on participant count ranges, not user-selected).
- The assigned OSH level is used by the **Security & Order team (Tim Keamanan & Ketertiban)** to prepare event needs (equipment, personnel, access control).
- Real-time availability status.
- Booking requests that require operator approval.
- Cancellation and rescheduling functionality.

### 6. Display System — Three Display Types

Each display supports **two layout orientations**: **portrait** (vertical monitor) and **landscape** (horizontal monitor). Layout is configurable per display instance. Media content **autoplots and loops** continuously on all display types.

#### 6a. Lobby Display (Room Grouping Display)

- Shows all rooms in a room grouping.
- **Media section**: autoplays and loops through the room grouping's media (video, photo, PDF slideshow).
- **Schedule section**: lists today's bookings for all rooms in the grouping (time, room name, event title, event leader).
- Available in **portrait** and **landscape** layout variants.
- Real-time updates when bookings change.
- No authentication required (kiosk mode).

#### 6b. Room Display

- Shows a single room's status.
- **If an event is in progress**: displays event title, event leader, OSH level, start/end time, next event info.
- **If room is idle**: autoplays and loops through the room's media (video, photo, PDF slideshow).
- Available in **portrait** and **landscape** layout variants.
- Real-time status updates.
- No authentication required (kiosk mode).

#### 6c. OSH Display (Occupational Safety and Health)

- Shows two tables side-by-side or stacked:
  - **Today's events**: all approved bookings for today (room, time, event title, event leader, participants count, OSH level with color).
  - **Tomorrow's events**: all approved bookings for tomorrow (same columns).
- OSH level is auto-assigned based on participants_count; shown with color coding (Low=green, Mid=yellow, High=red).
- Purpose: helps **Security & Order team** prepare equipment, personnel, and access control per event.
- Available in **portrait** and **landscape** layout variants.
- Real-time updates.
- No authentication required (kiosk mode).

### 7. Notifications

- Email and in-app notifications for booking confirmations, cancellations, and changes.
- Push notifications for real-time updates.

### 8. Integration

- Integration with popular calendar and scheduling tools.
- Sync booking data with external calendars.

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

## Open Questions

1. **Integration Support**: Which specific calendar and scheduling tools are the priority for integration?
2. **User Feedback Mechanism**: How will user feedback be collected and managed for continuous improvement?
3. **Hardware Requirements**: What are the specifications for the digital displays in lobbies and meeting rooms?
4. **Media Storage**: Local disk or S3? Max file size limits?
5. **OSH Standards**: Which specific OSH classification system should be used? Are there regulatory requirements?
