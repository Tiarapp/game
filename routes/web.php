<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', [GameController::class, 'hub'])->name('hub');
Route::get('/number-hunt', [GameController::class, 'index'])->name('number-hunt');
Route::get('/word-hunt', [GameController::class, 'word'])->name('word-hunt');
Route::get('/tebak-gambar', [GameController::class, 'picture'])->name('tebak-gambar');
Route::post('/api/games', [GameController::class, 'store'])->name('games.store');
Route::get('/api/stats', [GameController::class, 'stats'])->name('games.stats');
