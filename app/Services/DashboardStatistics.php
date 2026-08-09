<?php

namespace App\Services;

use App\Models\Booking;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardStatistics
{
    public const DEFAULT_MONTHS = 12;

    /**
     * Build the list of month buckets ending at (and including) the current month.
     *
     * @return array<int, array{key: string, label: string}>
     */
    public function monthBuckets(int $months = self::DEFAULT_MONTHS): array
    {
        $end = now()->startOfMonth();

        $buckets = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = $end->copy()->subMonths($i);

            $buckets[] = [
                'key' => $date->format('Y-m'),
                'label' => $date->isoFormat('MMM YY'),
            ];
        }

        return $buckets;
    }

    /**
     * Build the inclusive month range used to scope monthly queries.
     *
     * @return array{CarbonImmutable, CarbonImmutable}
     */
    private function monthRange(int $months = self::DEFAULT_MONTHS): array
    {
        $end = now()->startOfMonth();

        return [
            $end->copy()->subMonths($months - 1),
            $end->copy()->addMonth(),
        ];
    }

    /**
     * Build the driver-agnostic SQL expression extracting the YYYY-MM month from start_time.
     *
     * @return literal-string
     */
    private function monthExpression(): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', bookings.start_time) as month"
            : "DATE_FORMAT(bookings.start_time, '%Y-%m') as month";
    }

    /**
     * Zero-fill a grouped monthly result into every month bucket.
     *
     * @param  array<int, array{key: string, label: string}>  $buckets
     * @param  Collection<int, \stdClass>  $rows
     * @param  array<int, string>  $keys
     * @return array<int, array<string, int|string>>
     */
    private function fillMonths(array $buckets, Collection $rows, array $keys): array
    {
        $rowsByMonth = $rows->keyBy('month');

        return collect($buckets)->map(function (array $bucket) use ($rowsByMonth, $keys) {
            $row = $rowsByMonth->get($bucket['key'], null);

            $data = ['label' => $bucket['label']];

            foreach ($keys as $key) {
                $data[$key] = $row === null ? 0 : (int) $row->{$key};
            }

            return $data;
        })->values()->all();
    }

    /**
     * Keep the top rows and group the remainder into a "Lainnya" slice.
     *
     * @param  Collection<int, array{name: string, value: int}>  $rows
     * @return array<int, array{name: string, value: int}>
     */
    private function withOthers(Collection $rows, int $top): array
    {
        $sorted = $rows->sortByDesc('value')->values();

        $result = $sorted->take($top)->all();

        $rest = $sorted->slice($top);

        if ($rest->isNotEmpty()) {
            $result[] = ['name' => 'Lainnya', 'value' => (int) $rest->sum('value')];
        }

        return $result;
    }

    /**
     * Zero-fill a grouped monthly result into named per-month buckets.
     *
     * @param  array<int, array{key: string, label: string}>  $buckets
     * @param  Collection<int, \stdClass>  $rows
     * @param  array<int, string>  $names
     * @return array<int, array<string, int|string>>
     */
    private function fillNamedMonths(array $buckets, Collection $rows, array $names, string $othersLabel): array
    {
        $rowsByMonth = $rows->groupBy('month');

        $data = [];

        foreach ($buckets as $bucket) {
            $row = ['label' => $bucket['label']];

            foreach ($names as $name) {
                $row[$name] = 0;
            }

            $row[$othersLabel] = 0;

            foreach ($rowsByMonth->get($bucket['key'], collect()) as $booking) {
                $key = in_array($booking->name, $names, true) ? (string) $booking->name : $othersLabel;
                $row[$key] += (int) $booking->value;
            }

            $data[] = $row;
        }

        return $data;
    }

    /**
     * Map ranked aggregate query rows into the {name, value} chart shape.
     *
     * @return array<int, array{name: string, value: int}>
     */
    private function ranking(Builder $query, int $top, bool $withOthers): array
    {
        $rows = $query->get()->map(fn (object $row) => [
            'name' => (string) $row->name,
            'value' => (int) $row->value,
        ]);

        return $withOthers
            ? $this->withOthers(collect($rows), $top)
            : $rows->slice(0, $top)->all();
    }

    /**
     * Monthly event counts for the last 12 months (zero-filled).
     *
     * @return array<int, array<string, int|string>>
     */
    public function monthlyEvents(int $months = self::DEFAULT_MONTHS): array
    {
        [$from, $to] = $this->monthRange($months);

        $rows = Booking::toBase()
            ->selectRaw($this->monthExpression())
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved")
            ->selectRaw("COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected")
            ->where('start_time', '>=', $from)
            ->where('start_time', '<', $to)
            ->groupBy('month')
            ->get();

        return $this->fillMonths($this->monthBuckets($months), $rows, ['total', 'approved', 'rejected']);
    }

    /**
     * Monthly participant totals (approved events only) for the last 12 months (zero-filled).
     *
     * @return array<int, array<string, int|string>>
     */
    public function monthlyParticipants(int $months = self::DEFAULT_MONTHS): array
    {
        [$from, $to] = $this->monthRange($months);

        $rows = Booking::toBase()
            ->selectRaw($this->monthExpression())
            ->selectRaw('SUM(participants_count) as participants')
            ->where('status', 'approved')
            ->where('start_time', '>=', $from)
            ->where('start_time', '<', $to)
            ->groupBy('month')
            ->get();

        return $this->fillMonths($this->monthBuckets($months), $rows, ['participants']);
    }

    /**
     * Monthly approved event counts split by the top users and "Lainnya".
     *
     * @return array<int, array<string, int|string>>
     */
    public function monthlyUsers(int $months = self::DEFAULT_MONTHS, int $top = 3): array
    {
        [$from, $to] = $this->monthRange($months);

        $names = $this->monthlyTopNames('bookings.requested_id', 'users', $from, $to, $top);

        $rows = Booking::toBase()
            ->join('users', 'users.id', '=', 'bookings.requested_id')
            ->selectRaw($this->monthExpression())
            ->selectRaw('users.name as name')
            ->selectRaw('COUNT(bookings.id) as value')
            ->where('bookings.status', 'approved')
            ->where('bookings.start_time', '>=', $from)
            ->where('bookings.start_time', '<', $to)
            ->groupBy('month', 'users.id', 'users.name')
            ->get();

        return $this->fillNamedMonths($this->monthBuckets($months), $rows, $names, 'Lainnya');
    }

    /**
     * Monthly approved event counts split by the top rooms and "Lainnya".
     *
     * @return array<int, array<string, int|string>>
     */
    public function monthlyRooms(int $months = self::DEFAULT_MONTHS, int $top = 3): array
    {
        [$from, $to] = $this->monthRange($months);

        $names = $this->monthlyTopNames('bookings.room_id', 'rooms', $from, $to, $top);

        $rows = Booking::toBase()
            ->join('rooms', 'rooms.id', '=', 'bookings.room_id')
            ->selectRaw($this->monthExpression())
            ->selectRaw('rooms.name as name')
            ->selectRaw('COUNT(bookings.id) as value')
            ->where('bookings.status', 'approved')
            ->where('bookings.start_time', '>=', $from)
            ->where('bookings.start_time', '<', $to)
            ->groupBy('month', 'rooms.id', 'rooms.name')
            ->get();

        return $this->fillNamedMonths($this->monthBuckets($months), $rows, $names, 'Lainnya');
    }

    /**
     * Resolve the top names (users or rooms) within the monthly window.
     *
     * @param  'bookings.requested_id'|'bookings.room_id'  $foreignKey
     * @param  'users'|'rooms'  $table
     * @return array<int, string>
     */
    private function monthlyTopNames(string $foreignKey, string $table, CarbonImmutable $from, CarbonImmutable $to, int $top): array
    {
        return Booking::toBase()
            ->join($table, "$table.id", '=', $foreignKey)
            ->selectRaw("$table.name as name")
            ->selectRaw('COUNT(bookings.id) as value')
            ->where('bookings.status', 'approved')
            ->where('bookings.start_time', '>=', $from)
            ->where('bookings.start_time', '<', $to)
            ->groupBy("$table.id", "$table.name")
            ->orderByDesc('value')
            ->orderBy('name')
            ->limit($top)
            ->pluck('name')
            ->all();
    }

    /**
     * All-time event counts grouped by status.
     *
     * @return array<int, array{name: string, value: int}>
     */
    public function eventsByStatus(): array
    {
        return Booking::toBase()
            ->selectRaw('status as name')
            ->selectRaw('COUNT(*) as value')
            ->groupBy('status')
            ->orderByDesc('value')
            ->orderBy('name')
            ->get()
            ->map(fn (object $row) => ['name' => (string) $row->name, 'value' => (int) $row->value])
            ->all();
    }

    /**
     * All-time participant totals grouped by room (top rooms + Others).
     *
     * @return array<int, array{name: string, value: int}>
     */
    public function participantsByRoom(int $top = 3): array
    {
        $rows = Booking::toBase()
            ->join('rooms', 'rooms.id', '=', 'bookings.room_id')
            ->selectRaw('rooms.name as name')
            ->selectRaw('SUM(bookings.participants_count) as value')
            ->where('bookings.status', 'approved')
            ->groupBy('rooms.id', 'rooms.name')
            ->orderByDesc('value')
            ->orderBy('name')
            ->get()
            ->map(fn (object $row) => ['name' => (string) $row->name, 'value' => (int) $row->value]);

        return $this->withOthers(collect($rows), $top);
    }

    /**
     * Top users by approved event count.
     *
     * @return array<int, array{name: string, value: int}>
     */
    public function topUsers(int $top = 3, bool $withOthers = false): array
    {
        $query = Booking::toBase()
            ->join('users', 'users.id', '=', 'bookings.requested_id')
            ->selectRaw('users.name as name')
            ->selectRaw('COUNT(bookings.id) as value')
            ->where('bookings.status', 'approved')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('value')
            ->orderBy('name');

        return $this->ranking($query, $top, $withOthers);
    }

    /**
     * Top users by approved event count, including the grouped remainder.
     *
     * @return array<int, array{name: string, value: int}>
     */
    public function usersShare(int $top = 3): array
    {
        return $this->topUsers($top, withOthers: true);
    }

    /**
     * Top rooms by approved event count.
     *
     * @return array<int, array{name: string, value: int}>
     */
    public function topRooms(int $top = 3, bool $withOthers = false): array
    {
        $query = Booking::toBase()
            ->join('rooms', 'rooms.id', '=', 'bookings.room_id')
            ->selectRaw('rooms.name as name')
            ->selectRaw('COUNT(bookings.id) as value')
            ->where('bookings.status', 'approved')
            ->groupBy('rooms.id', 'rooms.name')
            ->orderByDesc('value')
            ->orderBy('name');

        return $this->ranking($query, $top, $withOthers);
    }

    /**
     * Top rooms by approved event count, including the grouped remainder.
     *
     * @return array<int, array{name: string, value: int}>
     */
    public function roomsShare(int $top = 3): array
    {
        return $this->topRooms($top, withOthers: true);
    }
}
