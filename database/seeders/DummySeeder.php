<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\Media;
use App\Models\OshLevel;
use App\Models\Person;
use App\Models\Room;
use App\Models\RoomGroup;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DummySeeder extends Seeder
{
    private array $pdfs = [
        'bookings/QsP5PSNHnbWutgDDgZLZ8VCquUrQzva7MauqeACS.pdf',
        'bookings/WgdtqLY3Ms57DczM0lCZQf8fRfsMAhuOtkZxA787.pdf',
        'bookings/UwtEMnFoT2EBX3Ar03aaqw5DmJDbSo3ha0wUwdA3.pdf',
    ];

    public function run(): void
    {
        $this->seedMasterData();
        $this->seedBookings();
        $this->seedMedia();
        $this->seedNotifications();
    }

    private function seedMasterData(): void
    {
        // People (event leaders)
        Person::updateOrCreate(['name' => 'Budi Santoso'], ['is_active' => true, 'photo' => 'event-leaders/lXx4aQo3IxxX7OuVyApWyaWUmEQf5H0OCgCq8iVB.png']);
        Person::updateOrCreate(['name' => 'Siti Rahayu'], ['is_active' => true, 'photo' => 'event-leaders/lXx4aQo3IxxX7OuVyApWyaWUmEQf5H0OCgCq8iVB.png']);
        Person::updateOrCreate(['name' => 'Andi Wijaya'], ['is_active' => true, 'photo' => 'event-leaders/lXx4aQo3IxxX7OuVyApWyaWUmEQf5H0OCgCq8iVB.png']);
        Person::updateOrCreate(['name' => 'Dewi Lestari'], ['is_active' => false]);

        // OSH Levels
        OshLevel::updateOrCreate(
            ['name' => 'Low'],
            ['color' => '#22c55e', 'min_participants' => 1, 'max_participants' => 20, 'sort_order' => 1, 'is_active' => true],
        );
        OshLevel::updateOrCreate(
            ['name' => 'Mid'],
            ['color' => '#eab308', 'min_participants' => 21, 'max_participants' => 50, 'sort_order' => 2, 'is_active' => true],
        );
        OshLevel::updateOrCreate(
            ['name' => 'High'],
            ['color' => '#ef4444', 'min_participants' => 51, 'max_participants' => 9999, 'sort_order' => 3, 'is_active' => true],
        );

        // Buildings
        Building::updateOrCreate(['name' => 'Gedung Utama'], ['is_active' => true]);
        Building::updateOrCreate(['name' => 'Gedung Annex'], ['is_active' => true]);

        // Room Groups
        RoomGroup::updateOrCreate(['name' => 'Lobby Lantai 1'], ['building_id' => 1, 'is_active' => true]);
        RoomGroup::updateOrCreate(['name' => 'Lobby Lantai 2'], ['building_id' => 1, 'is_active' => true]);
        RoomGroup::updateOrCreate(['name' => 'Lobby'], ['building_id' => 2, 'is_active' => true]);

        // Rooms
        $rooms = [
            ['name' => 'Ruang Garuda', 'capacity' => 20, 'building_id' => 1],
            ['name' => 'Ruang Rajawali', 'capacity' => 10, 'building_id' => 1],
            ['name' => 'Ruang Merpati', 'capacity' => 15, 'building_id' => 1],
            ['name' => 'Ruang Elang', 'capacity' => 30, 'building_id' => 2],
            ['name' => 'Ruang Pelatihan A', 'capacity' => 50, 'building_id' => 2],
        ];

        foreach ($rooms as $room) {
            Room::updateOrCreate(['name' => $room['name']], [...$room, 'is_active' => true]);
        }

        // Room-Group pivot
        $pivotData = [
            ['room_id' => 1, 'room_group_id' => 1],
            ['room_id' => 2, 'room_group_id' => 1],
            ['room_id' => 3, 'room_group_id' => 2],
            ['room_id' => 4, 'room_group_id' => 2],
            ['room_id' => 5, 'room_group_id' => 3],
        ];

        foreach ($pivotData as $row) {
            $exists = DB::table('room_room_group')
                ->where('room_id', $row['room_id'])
                ->where('room_group_id', $row['room_group_id'])
                ->exists();

            if (! $exists) {
                DB::table('room_room_group')->insert([
                    ...$row,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedBookings(): void
    {
        // Clear existing bookings to avoid duplicates on re-run
        DB::table('bookings')->truncate();

        $admin = User::where('email', 'admin@example.com')->first();
        $operator = User::where('email', 'operator@example.com')->first();
        $user = User::where('email', 'user@example.com')->first();
        $now = now();

        $bookings = [
            // ─── PAST BOOKINGS (D-7 to D-1) ───
            // P1: D-7, Room 1, approved, user, Budi, 15 pax (Low)
            $this->booking(1, 3, 1, 'Rapat Koordinasi Mingguan', $now->copy()->subDays(7)->setTime(8, 0), $now->copy()->subDays(7)->setTime(10, 0), 15, 'approved', $admin),
            // P2: D-7, Room 4, approved, operator, Siti, 25 pax (Mid)
            $this->booking(4, 2, 2, 'Workshop Desain Interior', $now->copy()->subDays(7)->setTime(13, 0), $now->copy()->subDays(7)->setTime(15, 0), 25, 'approved', $admin),
            // P3: D-6, Room 3, approved, user, no chair, 8 pax (Low)
            $this->booking(3, 3, null, 'Presentasi Proyek Alpha', $now->copy()->subDays(6)->setTime(9, 0), $now->copy()->subDays(6)->setTime(11, 0), 8, 'approved', $admin),
            // P4: D-5, Room 5, approved, admin, Andi, 45 pax (Mid)
            $this->booking(5, 1, 3, 'Pelatihan K3 Dasar', $now->copy()->subDays(5)->setTime(8, 0), $now->copy()->subDays(5)->setTime(12, 0), 45, 'approved', $operator, 'Pelatihan K3 untuk seluruh staf'),
            // P5: D-5, Room 2, rejected, user, no chair, 5 pax (Low)
            $this->booking(2, 3, null, 'Evaluasi Vendor Q2', $now->copy()->subDays(5)->setTime(14, 0), $now->copy()->subDays(5)->setTime(16, 0), 5, 'rejected', null, null, 'Room unavailable due to electrical maintenance'),
            // P6: D-4, Room 1, approved, operator, Siti, 15 pax (Low)
            $this->booking(1, 2, 2, 'Briefing Proyek Baru', $now->copy()->subDays(4)->setTime(14, 0), $now->copy()->subDays(4)->setTime(16, 0), 15, 'approved', $admin),
            // P7: D-4, Room 3, approved, user, Budi, 10 pax (Low)
            $this->booking(3, 3, 1, 'Brainstorming Produk', $now->copy()->subDays(4)->setTime(8, 0), $now->copy()->subDays(4)->setTime(10, 0), 10, 'approved', $admin),
            // P8: D-3, Room 4, approved, user, Andi, 25 pax (Mid)
            $this->booking(4, 3, 3, 'Seminar Teknologi', $now->copy()->subDays(3)->setTime(9, 0), $now->copy()->subDays(3)->setTime(12, 0), 25, 'approved', $admin),
            // P9: D-3, Room 5, cancelled, operator, no chair, 30 pax (Mid)
            $this->booking(5, 2, null, 'Workshop Manajemen Risiko', $now->copy()->subDays(3)->setTime(13, 0), $now->copy()->subDays(3)->setTime(16, 0), 30, 'cancelled'),
            // P10: D-2, Room 2, approved, user, Budi, 7 pax (Low)
            $this->booking(2, 3, 1, 'Diskusi Tim Kecil', $now->copy()->subDays(2)->setTime(10, 0), $now->copy()->subDays(2)->setTime(12, 0), 7, 'approved', $admin),
            // P11: D-2, Room 1, rejected, operator, no chair, 10 pax (Low)
            $this->booking(1, 2, null, 'Rapat Evaluasi Kinerja', $now->copy()->subDays(2)->setTime(8, 0), $now->copy()->subDays(2)->setTime(10, 0), 10, 'rejected', null, null, 'Conflicting with scheduled building inspection'),
            // P12: D-1, Room 3, approved, user, Siti, 12 pax (Low)
            $this->booking(3, 3, 2, 'Presentasi Laporan Bulanan', $now->copy()->subDays(1)->setTime(13, 0), $now->copy()->subDays(1)->setTime(15, 0), 12, 'approved', $admin),

            // ─── TODAY'S BOOKINGS ───
            // T1: Room 1, approved, operator, Budi, 15 pax (Low) — IN PROGRESS
            $this->booking(1, 2, 1, 'Rapat Pembukaan Bulanan', $now->copy()->subHour()->setTime(8, 0), $now->copy()->addHour()->setTime(10, 0), 15, 'approved', $admin),
            // T2: Room 4, approved, user, Siti, 25 pax (Mid) — upcoming today
            $this->booking(4, 3, 2, 'Forum Diskusi Teknologi', $now->copy()->setTime(14, 0), $now->copy()->setTime(16, 0), 25, 'approved', $admin, null, null, 0),
            // T3: Room 2, pending, user, Andi, 8 pax (Low)
            $this->booking(2, 3, 3, 'Team Huddle', $now->copy()->setTime(15, 0), $now->copy()->setTime(16, 30), 8, 'pending'),
            // T4: Room 5, rejected, operator, no chair, 40 pax (Mid)
            $this->booking(5, 2, null, 'Maintenance Training Setup', $now->copy()->setTime(9, 0), $now->copy()->setTime(11, 0), 40, 'rejected', null, null, 'Room required for scheduled maintenance training', 1),
            // T5: Room 3, approved, user, Siti, 10 pax (Low) — IN PROGRESS
            $this->booking(3, 3, 2, 'Presentasi Hasil Riset', $now->copy()->subMinutes(30)->setTime(9, 30), $now->copy()->addMinutes(90)->setTime(11, 30), 10, 'approved', $admin),
            // T6: Room 1, cancelled, user, no chair, 12 pax (Low)
            $this->booking(1, 3, null, 'Evening Sync', $now->copy()->setTime(17, 0), $now->copy()->setTime(18, 0), 12, 'cancelled', null, null, null, 2),

            // ─── TOMORROW'S BOOKINGS ───
            // M1: Room 1, approved, user, Budi, 18 pax (Low)
            $this->booking(1, 3, 1, 'Kick-off Proyek Baru', $now->copy()->addDay()->setTime(8, 0), $now->copy()->addDay()->setTime(10, 0), 18, 'approved', $admin),
            // M2: Room 3, approved, operator, Siti, 12 pax (Low)
            $this->booking(3, 2, 2, 'Workshop UI/UX', $now->copy()->addDay()->setTime(10, 30), $now->copy()->addDay()->setTime(12, 30), 12, 'approved', $admin),
            // M3: Room 5, pending, user, Andi, 45 pax (Mid)
            $this->booking(5, 3, 3, 'Safety Induction', $now->copy()->addDay()->setTime(9, 0), $now->copy()->addDay()->setTime(12, 0), 45, 'pending'),
            // M4: Room 4, rejected, operator, no chair, 28 pax (Mid)
            $this->booking(4, 2, null, 'Rapat Evaluasi Kuartalan', $now->copy()->addDay()->setTime(14, 0), $now->copy()->addDay()->setTime(16, 0), 28, 'rejected', null, null, 'Room has been reserved for priority executive meeting'),
            // M5: Room 2, approved, user, Budi, 5 pax (Low)
            $this->booking(2, 3, 1, 'Check-in Tim Kecil', $now->copy()->addDay()->setTime(8, 0), $now->copy()->addDay()->setTime(9, 30), 5, 'approved', $admin),

            // ─── FUTURE BOOKINGS (D+2 to D+8) ───
            // F1: D+2, Room 1, approved, user, Andi, 18 pax (Low)
            $this->booking(1, 3, 3, 'Q3 Review Presentation', $now->copy()->addDays(2)->setTime(8, 0), $now->copy()->addDays(2)->setTime(10, 0), 18, 'approved', $admin),
            // F2: D+2, Room 5, pending, operator, no chair, 55 pax (High)
            $this->booking(5, 2, null, 'Pelatihan Leadership', $now->copy()->addDays(2)->setTime(13, 0), $now->copy()->addDays(2)->setTime(16, 0), 55, 'pending'),
            // F3: D+3, Room 4, approved, user, Siti, 28 pax (Mid)
            $this->booking(4, 3, 2, 'Seminar Kewirausahaan', $now->copy()->addDays(3)->setTime(9, 0), $now->copy()->addDays(3)->setTime(12, 0), 28, 'approved', $admin),
            // F4: D+4, Room 3, pending, user, Budi, 10 pax (Low)
            $this->booking(3, 3, 1, 'Rapat Tim Proyek X', $now->copy()->addDays(4)->setTime(8, 0), $now->copy()->addDays(4)->setTime(10, 0), 10, 'pending'),
            // F5: D+4, Room 2, approved, operator, no chair, 7 pax (Low)
            $this->booking(2, 2, null, 'Briefing Marketing', $now->copy()->addDays(4)->setTime(14, 0), $now->copy()->addDays(4)->setTime(16, 0), 7, 'approved', $admin),
            // F6: D+5, Room 1, approved, user, Siti, 15 pax (Low)
            $this->booking(1, 3, 2, 'Evaluasi Vendor Tengah Tahun', $now->copy()->addDays(5)->setTime(13, 0), $now->copy()->addDays(5)->setTime(15, 0), 15, 'approved', $admin),
            // F7: D+5, Room 5, pending, admin, Andi, 42 pax (Mid)
            $this->booking(5, 1, 3, 'Workshop Emergency Response', $now->copy()->addDays(5)->setTime(8, 0), $now->copy()->addDays(5)->setTime(12, 0), 42, 'pending'),
            // F8: D+6, Room 4, pending, user, no chair, 20 pax (Low)
            $this->booking(4, 3, null, 'Presentasi Hasil Survey', $now->copy()->addDays(6)->setTime(10, 0), $now->copy()->addDays(6)->setTime(12, 0), 20, 'pending'),
            // F9: D+7, Room 3, approved, operator, Budi, 12 pax (Low)
            $this->booking(3, 2, 1, 'Rapat Semester', $now->copy()->addDays(7)->setTime(14, 0), $now->copy()->addDays(7)->setTime(16, 0), 12, 'approved', $admin),
        ];

        DB::table('bookings')->insert($bookings);
    }

    private function seedMedia(): void
    {
        DB::table('media')->truncate();

        $mediaItems = [
            // Room Group 1 (Lobby Lantai 1) — 3 items
            ['mediable_type' => RoomGroup::class, 'mediable_id' => 1, 'type' => 'image', 'name' => 'Welcome Banner Lantai 1', 'path' => 'media/xGhev71lSbFMEevALo1ncDeuqqHBaFloHrScFjiV.png', 'size' => 1530582, 'mime' => 'image/png', 'sort_order' => 1, 'is_active' => true],
            ['mediable_type' => RoomGroup::class, 'mediable_id' => 1, 'type' => 'image', 'name' => 'Meeting Schedule Board', 'path' => 'media/X9NFrmSblp5eSjUfzk6WtYhJlxC9Clph9fXLcTxh.png', 'size' => 1584838, 'mime' => 'image/png', 'sort_order' => 2, 'is_active' => true],
            ['mediable_type' => RoomGroup::class, 'mediable_id' => 1, 'type' => 'video', 'name' => 'Lobby Display Video', 'path' => 'media/TKLCCj7JdZNoq7soQTJm4IQjwYhzPbk5PTJbxMa1.mp4', 'size' => 2848208, 'mime' => 'video/mp4', 'sort_order' => 3, 'is_active' => true],

            // Room Group 2 (Lobby Lantai 2) — 2 items
            ['mediable_type' => RoomGroup::class, 'mediable_id' => 2, 'type' => 'image', 'name' => 'Welcome Banner Lantai 2', 'path' => 'media/b1bkmzo4nGDYrdJw1EDOWGYxg9yKHl9wJGIEci8W.png', 'size' => 667601, 'mime' => 'image/png', 'sort_order' => 1, 'is_active' => true],
            ['mediable_type' => RoomGroup::class, 'mediable_id' => 2, 'type' => 'video', 'name' => 'Lobby Display Video L2', 'path' => 'media/L0ErPYli3HYB6mjAEJLRxeqMPQtc0NZ6Sfp6Oklh.mp4', 'size' => 14809308, 'mime' => 'video/mp4', 'sort_order' => 2, 'is_active' => true],

            // Room Group 3 (Lobby) — 1 item
            ['mediable_type' => RoomGroup::class, 'mediable_id' => 3, 'type' => 'image', 'name' => 'Training Center Welcome', 'path' => 'media/ci6eL0eUMjDYt27yKn1MmyDvO1lRAM2X3fU4zbxH.png', 'size' => 120829, 'mime' => 'image/png', 'sort_order' => 1, 'is_active' => true],

            // Room 1 (Ruang Garuda) — 1 item
            ['mediable_type' => Room::class, 'mediable_id' => 1, 'type' => 'image', 'name' => 'Garuda Room Display', 'path' => 'media/h6D0WPBuLEnDr3Fvwij7xWE9qnEgvf6Z5wFirgx3.png', 'size' => 22188, 'mime' => 'image/png', 'sort_order' => 1, 'is_active' => true],

            // Room 4 (Ruang Elang) — 1 item
            ['mediable_type' => Room::class, 'mediable_id' => 4, 'type' => 'image', 'name' => 'Elang Room Display', 'path' => 'media/k1CrFx73TJ6Bg0ig4Ue6dcqjTxkxaGRibPDpSXDC.webp', 'size' => 66180, 'mime' => 'image/webp', 'sort_order' => 1, 'is_active' => true],
        ];

        foreach ($mediaItems as $item) {
            $item['created_at'] = now();
            $item['updated_at'] = now();
            DB::table('media')->insert($item);
        }
    }

    private function seedNotifications(): void
    {
        DB::table('notifications')->truncate();

        $admin = User::where('email', 'admin@example.com')->first();
        $operator = User::where('email', 'operator@example.com')->first();
        $user = User::where('email', 'user@example.com')->first();

        $notifications = [
            // Admin: unread booking_created (for pending T3)
            [
                'id' => Str::uuid()->toString(),
                'type' => 'App\\Notifications\\BookingCreated',
                'notifiable_type' => User::class,
                'notifiable_id' => $admin->id,
                'data' => json_encode([
                    'type' => 'booking_created',
                    'booking_id' => 23,
                    'message' => 'New booking "Team Huddle" submitted by Regular User for Ruang Rajawali',
                    'booking' => ['id' => 23, 'title' => 'Team Huddle', 'room' => 'Ruang Rajawali', 'start_time' => now()->setTime(15, 0)->toIso8601String(), 'end_time' => now()->setTime(16, 30)->toIso8601String()],
                ]),
                'read_at' => null,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ],
            // Admin: unread booking_created (for pending M3)
            [
                'id' => Str::uuid()->toString(),
                'type' => 'App\\Notifications\\BookingCreated',
                'notifiable_type' => User::class,
                'notifiable_id' => $admin->id,
                'data' => json_encode([
                    'type' => 'booking_created',
                    'booking_id' => 26,
                    'message' => 'New booking "Safety Induction" submitted by Regular User for Ruang Pelatihan A',
                    'booking' => ['id' => 26, 'title' => 'Safety Induction', 'room' => 'Ruang Pelatihan A', 'start_time' => now()->addDay()->setTime(9, 0)->toIso8601String(), 'end_time' => now()->addDay()->setTime(12, 0)->toIso8601String()],
                ]),
                'read_at' => null,
                'created_at' => now()->subHour(),
                'updated_at' => now()->subHour(),
            ],
            // Admin: unread booking_cancelled (for T6)
            [
                'id' => Str::uuid()->toString(),
                'type' => 'App\\Notifications\\BookingCancelled',
                'notifiable_type' => User::class,
                'notifiable_id' => $admin->id,
                'data' => json_encode([
                    'type' => 'booking_cancelled',
                    'booking_id' => 27,
                    'message' => 'Booking "Evening Sync" has been cancelled.',
                    'booking' => ['id' => 27, 'title' => 'Evening Sync', 'room' => 'Ruang Garuda', 'start_time' => now()->setTime(17, 0)->toIso8601String(), 'end_time' => now()->setTime(18, 0)->toIso8601String()],
                ]),
                'read_at' => null,
                'created_at' => now()->subMinutes(20),
                'updated_at' => now()->subMinutes(20),
            ],
            // Operator: unread booking_rejected (for T4)
            [
                'id' => Str::uuid()->toString(),
                'type' => 'App\\Notifications\\BookingRejected',
                'notifiable_type' => User::class,
                'notifiable_id' => $operator->id,
                'data' => json_encode([
                    'type' => 'booking_rejected',
                    'booking_id' => 25,
                    'message' => 'Your booking "Maintenance Training Setup" has been rejected.',
                    'reason' => 'Room required for scheduled maintenance training',
                    'booking' => ['id' => 25, 'title' => 'Maintenance Training Setup', 'room' => 'Ruang Pelatihan A', 'start_time' => now()->setTime(9, 0)->toIso8601String(), 'end_time' => now()->setTime(11, 0)->toIso8601String()],
                ]),
                'read_at' => null,
                'created_at' => now()->subMinutes(45),
                'updated_at' => now()->subMinutes(45),
            ],
            // User: read booking_approved (for F1)
            [
                'id' => Str::uuid()->toString(),
                'type' => 'App\\Notifications\\BookingApproved',
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode([
                    'type' => 'booking_approved',
                    'booking_id' => 28,
                    'message' => 'Your booking "Q3 Review Presentation" has been approved.',
                    'booking' => ['id' => 28, 'title' => 'Q3 Review Presentation', 'room' => 'Ruang Garuda', 'start_time' => now()->addDays(2)->setTime(8, 0)->toIso8601String(), 'end_time' => now()->addDays(2)->setTime(10, 0)->toIso8601String()],
                ]),
                'read_at' => now()->subMinutes(10),
                'created_at' => now()->subMinutes(30),
                'updated_at' => now()->subMinutes(30),
            ],
        ];

        DB::table('notifications')->insert($notifications);
    }

    private function booking(
        int $roomId,
        int $requesterId,
        ?int $chairpersonId,
        string $title,
        string $startTime,
        string $endTime,
        int $participantsCount,
        string $status,
        ?User $approver = null,
        ?string $description = null,
        ?string $reason = null,
        int $pdfIndex = -1,
    ): array {
        $pdfPath = $pdfIndex >= 0 ? $this->pdfs[$pdfIndex % count($this->pdfs)] : null;

        return [
            'room_id' => $roomId,
            'requested_id' => $requesterId,
            'chairperson_id' => $chairpersonId,
            'title' => $title,
            'description' => $description,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'participants_count' => $participantsCount,
            'status' => $status,
            'attachment_path' => $pdfPath,
            'reason' => $reason,
            'approved_id' => $approver?->id,
            'approved_at' => $status === 'approved' && $approver ? now()->subHours(rand(12, 24)) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
