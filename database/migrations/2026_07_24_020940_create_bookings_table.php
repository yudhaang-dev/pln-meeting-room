<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->restrictOnDelete();
            $table->foreignId('requested_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('chairperson_id')->constrained('people')->restrictOnDelete();
            $table->foreignId('osh_level_id')->constrained('osh_levels')->restrictOnDelete();
            $table->string('title', 255);
            $table->string('description')->nullable();
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->unsignedInteger('participants_count')->default(1);
            $table->string('status')->default('pending');
            $table->string('attachment_path')->nullable();
            $table->string('qr_attendance_path')->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('approved_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['room_id', 'start_time', 'end_time']);
            $table->index(['requested_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
