<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\Api\PaymentHistoryController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Payment History routes
Route::prefix('payment-histories')->group(function () {
    Route::get('/', [PaymentHistoryController::class, 'index']);
    Route::post('/', [PaymentHistoryController::class, 'store']);
    Route::get('/{id}', [PaymentHistoryController::class, 'show']);
    Route::put('/{id}', [PaymentHistoryController::class, 'update']);
    Route::delete('/{id}', [PaymentHistoryController::class, 'destroy']);
});

// Room routes
Route::get('/rooms', [RoomController::class, 'index']);
Route::post('/rooms', [RoomController::class, 'store']);
Route::get('/rooms/{id}', [RoomController::class, 'show']);
Route::put('/rooms/{id}', [RoomController::class, 'update']);
Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);

// Tenant routes
Route::get('/tenants', [TenantController::class, 'index']);
Route::post('/tenants', [TenantController::class, 'store']);
Route::get('/tenants/{id}', [TenantController::class, 'show']);
Route::put('/tenants/{id}', [TenantController::class, 'update']);
Route::delete('/tenants/{id}', [TenantController::class, 'destroy']); 