<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /** User dianggap online bila aktif dalam rentang ini. */
    private const ONLINE_MINUTES = 5;

    /** Kategori filter -> pola event. */
    private const CATEGORIES = [
        'auth' => ['auth.login', 'auth.logout'],
        'failed' => ['auth.failed', 'auth.lockout'],
        'booking' => ['booking.*'],
        'master' => ['room.*', 'building.*', 'room_group.*', 'osh_level.*', 'person.*', 'media.*'],
        'user' => ['user.*'],
    ];

    public function __invoke(Request $request): Response
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(array_keys(self::CATEGORIES))],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', Rule::in(['10', '25', '50', '100'])],
        ]);

        $logs = ActivityLog::with('user:id,name,role')
            ->when($validated['status'] ?? null, fn (Builder $q, string $category) => $this->filterCategory($q, $category))
            ->when($validated['search'] ?? null, function (Builder $q, string $search) {
                $q->where(function (Builder $q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                        ->orWhere('actor_email', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%")
                        ->orWhereHas('user', fn (Builder $q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('id')
            ->paginate((int) ($validated['per_page'] ?? 25))
            ->withQueryString()
            ->through(fn (ActivityLog $log) => [
                'id' => $log->id,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                'event' => $log->event,
                'description' => $log->description,
                'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name, 'role' => $log->user->role] : null,
                'actor_email' => $log->actor_email,
                'ip_address' => $log->ip_address,
                'browser' => self::browser($log->user_agent),
                'changes' => self::changes($log->properties),
            ]);

        return Inertia::render('admin/activity', [
            'logs' => $logs,
            'online' => $this->online(),
            'summary' => [
                'online' => $this->onlineQuery()->distinct()->count('user_id'),
                'actions_today' => ActivityLog::where('created_at', '>=', now()->startOfDay())
                    ->where('event', 'not like', 'auth.%')->count(),
                'logins_today' => ActivityLog::where('created_at', '>=', now()->startOfDay())
                    ->where('event', 'auth.login')->count(),
                'failed_24h' => ActivityLog::where('created_at', '>=', now()->subDay())
                    ->whereIn('event', self::CATEGORIES['failed'])->count(),
            ],
            'online_minutes' => self::ONLINE_MINUTES,
        ]);
    }

    /**
     * @param  Builder<ActivityLog>  $query
     */
    private function filterCategory(Builder $query, string $category): void
    {
        $query->where(function (Builder $q) use ($category) {
            foreach (self::CATEGORIES[$category] as $pattern) {
                str_ends_with($pattern, '.*')
                    ? $q->orWhere('event', 'like', substr($pattern, 0, -1).'%')
                    : $q->orWhere('event', $pattern);
            }
        });
    }

    private function onlineQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('sessions')
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', now()->subMinutes(self::ONLINE_MINUTES)->getTimestamp());
    }

    /**
     * User yang sedang online (satu baris per user), beserta IP dan perangkat.
     *
     * @return array<int, array<string, mixed>>
     */
    private function online(): array
    {
        return $this->onlineQuery()
            ->join('users', 'users.id', '=', 'sessions.user_id')
            ->orderByDesc('sessions.last_activity')
            ->get(['users.id', 'users.name', 'users.role', 'sessions.ip_address', 'sessions.user_agent', 'sessions.last_activity'])
            ->groupBy('id')
            ->map(function ($sessions) {
                $first = $sessions->first();

                return [
                    'id' => $first->id,
                    'name' => $first->name,
                    'role' => $first->role,
                    'ips' => $sessions->pluck('ip_address')->filter()->unique()->values()->all(),
                    'browser' => self::browser($first->user_agent),
                    'sessions' => $sessions->count(),
                    'last_activity' => date('Y-m-d H:i:s', (int) $first->last_activity),
                ];
            })
            ->values()
            ->all();
    }

    private static function browser(?string $agent): ?string
    {
        if (! $agent) {
            return null;
        }

        $browser = match (true) {
            str_contains($agent, 'Edg/') => 'Edge',
            str_contains($agent, 'OPR/') || str_contains($agent, 'Opera') => 'Opera',
            str_contains($agent, 'SamsungBrowser') => 'Samsung Browser',
            str_contains($agent, 'Chrome/') => 'Chrome',
            str_contains($agent, 'Firefox/') => 'Firefox',
            str_contains($agent, 'Safari/') => 'Safari',
            default => 'Lainnya',
        };

        $os = match (true) {
            str_contains($agent, 'Tizen') => 'Tizen',
            str_contains($agent, 'Windows') => 'Windows',
            str_contains($agent, 'Android') => 'Android',
            str_contains($agent, 'iPhone') || str_contains($agent, 'iPad') => 'iOS',
            str_contains($agent, 'Mac OS') => 'macOS',
            str_contains($agent, 'Linux') => 'Linux',
            default => null,
        };

        return $os ? "{$browser} · {$os}" : $browser;
    }

    /**
     * Ringkasan perubahan: maksimal 5 baris "kolom: lama -> baru".
     *
     * @param  array<string, mixed>|null  $properties
     * @return array<int, string>
     */
    private static function changes(?array $properties): array
    {
        $changes = $properties['changes'] ?? [];

        if (! is_array($changes) || $changes === []) {
            return [];
        }

        $format = fn ($value) => match (true) {
            $value === null => '-',
            is_bool($value) => $value ? 'ya' : 'tidak',
            default => mb_strimwidth((string) $value, 0, 60, '…'),
        };

        return collect($changes)
            ->take(5)
            ->map(fn ($pair, $field) => "{$field}: {$format($pair[0] ?? null)} → {$format($pair[1] ?? null)}")
            ->values()
            ->all();
    }
}
