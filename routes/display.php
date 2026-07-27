<?php

use App\Http\Controllers\DisplayController;
use Illuminate\Support\Facades\Route;

Route::get('display/lobby/{roomGroup}', [DisplayController::class, 'lobby'])->name('display.lobby');
Route::get('display/room/{room}', [DisplayController::class, 'room'])->name('display.room');
Route::get('display/osh', [DisplayController::class, 'osh'])->name('display.osh');
