<?php

use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\BuildingController;
use App\Http\Controllers\Admin\GeneralSettingController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\OshLevelController;
use App\Http\Controllers\Admin\PersonController;
use App\Http\Controllers\Admin\RoomController;
use App\Http\Controllers\Admin\RoomGroupController;
use App\Http\Controllers\Admin\Settings\AppearanceController;
use App\Http\Controllers\Admin\Settings\ProfileController;
use App\Http\Controllers\Admin\Settings\SecurityController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:admin,operator'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', \App\Http\Controllers\Admin\DashboardController::class)->name('dashboard');

    Route::get('settings', [GeneralSettingController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [GeneralSettingController::class, 'update'])->name('settings.update');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');
    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::get('settings/appearance', [AppearanceController::class, 'edit'])->name('appearance.edit');

    Route::resource('people', PersonController::class)->except(['show', 'edit', 'create']);

    Route::resource('osh-levels', OshLevelController::class)->except(['show', 'edit', 'create']);
    Route::post('osh-levels/reorder', [OshLevelController::class, 'reorder'])->name('osh-levels.reorder');

    Route::resource('buildings', BuildingController::class)->except(['show', 'edit', 'create']);

    Route::resource('rooms', RoomController::class)->except(['show', 'edit', 'create']);
    Route::get('rooms/{room}/media', [RoomController::class, 'media'])->name('rooms.media');
    Route::post('rooms/{room}/media', [MediaController::class, 'store'])->name('rooms.media.store');
    Route::post('rooms/{room}/media/reorder', [MediaController::class, 'reorder'])->name('rooms.media.reorder');
    Route::put('rooms/{room}/media/{media}/toggle-active', [MediaController::class, 'toggleActive'])->name('rooms.media.toggleActive');
    Route::delete('rooms/{room}/media/{media}', [MediaController::class, 'destroy'])->name('rooms.media.destroy');

    Route::resource('room-groups', RoomGroupController::class)->except(['show', 'edit', 'create']);
    Route::get('room-groups/{roomGroup}/media', [RoomGroupController::class, 'media'])->name('room-groups.media');
    Route::post('room-groups/{roomGroup}/media', [MediaController::class, 'storeFromGrouping'])->name('room-groups.media.store');
    Route::post('room-groups/{roomGroup}/media/reorder', [MediaController::class, 'reorder'])->name('room-groups.media.reorder');
    Route::put('room-groups/{roomGroup}/media/{media}/toggle-active', [MediaController::class, 'toggleActive'])->name('room-groups.media.toggleActive');
    Route::delete('room-groups/{roomGroup}/media/{media}', [MediaController::class, 'destroy'])->name('room-groups.media.destroy');

    Route::post('media/chunk', [MediaController::class, 'chunk'])->name('media.chunk');
    Route::post('media/assemble', [MediaController::class, 'assemble'])->name('media.assemble');

    Route::resource('bookings', BookingController::class)->except(['edit', 'create']);
    Route::post('bookings/{booking}/approve', [BookingController::class, 'approve'])->name('bookings.approve');
    Route::post('bookings/{booking}/reject', [BookingController::class, 'reject'])->name('bookings.reject');

    Route::middleware('role:admin')->group(function () {
        Route::resource('users', UserController::class)->except(['edit', 'create', 'show']);
    });
});
