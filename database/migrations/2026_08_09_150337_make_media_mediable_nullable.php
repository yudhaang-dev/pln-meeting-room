<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('mediable_type')->nullable()->change();
            $table->unsignedBigInteger('mediable_id')->nullable()->change();
        });

        DB::table('media')->update([
            'mediable_type' => null,
            'mediable_id' => null,
        ]);
    }

    public function down(): void
    {
        DB::table('media')->update([
            'mediable_type' => '',
            'mediable_id' => 0,
        ]);

        Schema::table('media', function (Blueprint $table) {
            $table->string('mediable_type')->change();
            $table->unsignedBigInteger('mediable_id')->change();
        });
    }
};
