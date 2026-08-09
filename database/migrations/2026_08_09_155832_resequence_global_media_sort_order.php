<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $ids = DB::table('media')
            ->whereNull('mediable_type')
            ->whereNull('mediable_id')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id');

        foreach ($ids->values() as $index => $id) {
            DB::table('media')->where('id', $id)->update(['sort_order' => $index + 1]);
        }
    }

    public function down(): void {}
};
