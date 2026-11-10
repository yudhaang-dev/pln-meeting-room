<?php

namespace App\Services\Monitoring;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Pemeriksaan kesehatan server yang ringan dan aman dijalankan tiap kali halaman dibuka.
 * Tiap pemeriksaan mengembalikan status ok | warn | error.
 */
class ServerHealth
{
    private const LOG_WARN_MB = 50;

    /**
     * @return array<string, mixed>
     */
    public function check(): array
    {
        $checks = [
            $this->database(),
            $this->disk(),
            $this->storage(),
            $this->cache(),
            $this->logs(),
            $this->debugMode(),
        ];

        $statuses = array_column($checks, 'status');
        $overall = in_array('error', $statuses, true) ? 'error' : (in_array('warn', $statuses, true) ? 'warn' : 'ok');

        return [
            'overall' => $overall,
            'checks' => $checks,
            'info' => [
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
                'environment' => app()->environment(),
                'timezone' => config('app.timezone'),
                'server_time' => now()->format('Y-m-d H:i:s'),
                'os' => PHP_OS_FAMILY,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function database(): array
    {
        try {
            $started = microtime(true);
            DB::select('select 1');
            $ms = (int) round((microtime(true) - $started) * 1000);

            return [
                'key' => 'database',
                'label' => 'Database',
                'status' => $ms > 500 ? 'warn' : 'ok',
                'detail' => 'Terhubung ('.DB::getDriverName().'), respons '.$ms.' ms'.($ms > 500 ? ' (lambat)' : ''),
            ];
        } catch (Throwable $e) {
            return ['key' => 'database', 'label' => 'Database', 'status' => 'error', 'detail' => 'Tidak dapat terhubung ke database'];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function disk(): array
    {
        $path = base_path();
        $free = @disk_free_space($path);
        $total = @disk_total_space($path);

        if ($free === false || ! $total) {
            return ['key' => 'disk', 'label' => 'Ruang disk', 'status' => 'warn', 'detail' => 'Tidak dapat membaca ruang disk'];
        }

        $freePercent = $free / $total * 100;

        return [
            'key' => 'disk',
            'label' => 'Ruang disk',
            'status' => $freePercent < 5 ? 'error' : ($freePercent < 15 ? 'warn' : 'ok'),
            'detail' => sprintf('Sisa %s dari %s (%d%% bebas)', self::bytes($free), self::bytes($total), round($freePercent)),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function storage(): array
    {
        $dirs = [storage_path('app'), storage_path('logs'), storage_path('framework')];
        $bad = array_filter($dirs, fn (string $dir) => ! is_dir($dir) || ! is_writable($dir));

        return [
            'key' => 'storage',
            'label' => 'Folder penyimpanan',
            'status' => $bad === [] ? 'ok' : 'error',
            'detail' => $bad === [] ? 'Dapat ditulis' : 'Tidak dapat ditulis: '.implode(', ', array_map('basename', $bad)),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function cache(): array
    {
        try {
            $key = 'health.check.'.Str::random(8);
            Cache::put($key, 'ok', 10);
            $ok = Cache::get($key) === 'ok';
            Cache::forget($key);

            return ['key' => 'cache', 'label' => 'Cache', 'status' => $ok ? 'ok' : 'error', 'detail' => $ok ? 'Berfungsi ('.config('cache.default').')' : 'Gagal membaca/menulis cache'];
        } catch (Throwable) {
            return ['key' => 'cache', 'label' => 'Cache', 'status' => 'error', 'detail' => 'Gagal membaca/menulis cache'];
        }
    }

    /**
     * Log yang membengkak sering jadi penyebab server melambat.
     *
     * @return array<string, mixed>
     */
    private function logs(): array
    {
        $files = glob(storage_path('logs/*.log')) ?: [];
        $total = 0;
        $biggest = ['name' => null, 'size' => 0];

        foreach ($files as $file) {
            $size = (int) @filesize($file);
            $total += $size;

            if ($size > $biggest['size']) {
                $biggest = ['name' => basename($file), 'size' => $size];
            }
        }

        $warn = $biggest['size'] > self::LOG_WARN_MB * 1024 * 1024;

        return [
            'key' => 'logs',
            'label' => 'Berkas log',
            'status' => $warn ? 'warn' : 'ok',
            'detail' => $files === []
                ? 'Belum ada berkas log'
                : sprintf('Total %s; terbesar %s (%s)%s', self::bytes($total), $biggest['name'], self::bytes($biggest['size']), $warn ? ' - perlu dibersihkan' : ''),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function debugMode(): array
    {
        $risky = config('app.debug') && app()->isProduction();

        return [
            'key' => 'debug',
            'label' => 'Mode debug',
            'status' => $risky ? 'error' : (config('app.debug') ? 'warn' : 'ok'),
            'detail' => $risky
                ? 'APP_DEBUG aktif di production: pesan error bisa membocorkan data. Matikan segera.'
                : (config('app.debug') ? 'APP_DEBUG aktif (lingkungan '.app()->environment().'). Matikan saat dipakai sungguhan.' : 'Nonaktif'),
        ];
    }

    private static function bytes(float|int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;

        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, $i === 0 ? 0 : 1).' '.$units[$i];
    }
}
