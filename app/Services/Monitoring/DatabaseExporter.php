<?php

namespace App\Services\Monitoring;

use Illuminate\Support\Facades\DB;

/**
 * Ekspor database ke berkas SQL tanpa bergantung pada mysqldump.
 * Tabel sementara/sensitif (sesi login, cache, antrean) tidak ikut diekspor.
 */
class DatabaseExporter
{
    /** Tabel yang tidak ikut: sesi bisa dipakai membajak login, sisanya data sementara. */
    private const EXCLUDED = ['sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'password_reset_tokens'];

    private const BATCH = 200;

    public function filename(): string
    {
        return 'jadwal-rapat-'.now()->format('Ymd-His').'.sql';
    }

    /**
     * Tulis seluruh dump ke callback (dipanggil berulang, potongan demi potongan).
     *
     * @param  callable(string): void  $write
     */
    public function export(callable $write): void
    {
        $pdo = DB::getPdo();
        $driver = DB::getDriverName();

        $write("-- Ekspor database {$this->databaseName()}\n-- Dibuat: ".now()->toDateTimeString()."\n\n");

        if ($driver !== 'sqlite') {
            $write("SET FOREIGN_KEY_CHECKS=0;\nSET NAMES utf8mb4;\n\n");
        }

        foreach ($this->tables($driver) as $table) {
            $write("-- Tabel {$table}\n");
            $write("DROP TABLE IF EXISTS `{$table}`;\n");
            $write($this->createStatement($table, $driver).";\n\n");

            $buffer = [];

            foreach (DB::table($table)->cursor() as $row) {
                $values = array_map(
                    fn ($value) => $value === null ? 'NULL' : (is_int($value) || is_float($value) ? (string) $value : $pdo->quote((string) $value)),
                    (array) $row,
                );
                $buffer[] = '('.implode(',', $values).')';

                if (count($buffer) >= self::BATCH) {
                    $write($this->insert($table, $row, $buffer));
                    $buffer = [];
                }
            }

            if ($buffer !== []) {
                $write($this->insert($table, $row ?? (object) [], $buffer));
            }

            $write("\n");
        }

        if ($driver !== 'sqlite') {
            $write("SET FOREIGN_KEY_CHECKS=1;\n");
        }
    }

    /**
     * @return array<int, string>
     */
    private function tables(string $driver): array
    {
        $names = $driver === 'sqlite'
            ? DB::table('sqlite_master')->where('type', 'table')->where('name', 'not like', 'sqlite_%')->pluck('name')->all()
            : array_map(fn ($row) => array_values((array) $row)[0], DB::select('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"'));

        return array_values(array_diff($names, self::EXCLUDED));
    }

    private function createStatement(string $table, string $driver): string
    {
        if ($driver === 'sqlite') {
            return (string) DB::table('sqlite_master')->where('name', $table)->value('sql');
        }

        $row = (array) DB::select("SHOW CREATE TABLE `{$table}`")[0];

        return (string) ($row['Create Table'] ?? array_values($row)[1]);
    }

    /**
     * @param  array<int, string>  $rows
     */
    private function insert(string $table, object $sample, array $rows): string
    {
        $columns = implode(',', array_map(fn (string $c) => "`{$c}`", array_keys((array) $sample)));

        return "INSERT INTO `{$table}` ({$columns}) VALUES\n".implode(",\n", $rows).";\n";
    }

    private function databaseName(): string
    {
        return (string) (DB::getDatabaseName() ?: 'database');
    }
}
