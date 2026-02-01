<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Owner\CategoryController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Owner\OrderController as OwnerOrderController;
use App\Http\Controllers\Owner\ProductController;
use App\Http\Controllers\Pos\DashboardController as PosDashboardController;
use App\Http\Controllers\Pos\OrderController as PosOrderController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::redirect('/', '/login');

/*
|--------------------------------------------------------------------------
| Guest Routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    /*
    |--------------------------------------------------------------------------
    | POS Routes (Cashier & Owner)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:cashier,owner')->prefix('dashboard/pos')->name('pos.')->group(function () {
        Route::get('/', [PosDashboardController::class, 'index'])->name('dashboard');
        Route::post('/orders', [PosOrderController::class, 'store'])->name('orders.store');
    });

    /*
    |--------------------------------------------------------------------------
    | Owner Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:owner')->prefix('dashboard/owner')->name('owner.')->group(function () {
        // Dashboard
        Route::get('/', [OwnerDashboardController::class, 'index'])->name('dashboard');

        // Products
        Route::resource('products', ProductController::class)->except(['show']);
        Route::patch('/products/{product}/toggle-status', [ProductController::class, 'toggleStatus'])
            ->name('products.toggle-status');

        // Categories
        Route::resource('categories', CategoryController::class)->except(['show', 'create', 'edit']);
        Route::patch('/categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus'])
            ->name('categories.toggle-status');

        // Orders
        Route::get('/orders', [OwnerOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [OwnerOrderController::class, 'show'])->name('orders.show');
        Route::patch('/orders/{order}/payment-status', [OwnerOrderController::class, 'updatePaymentStatus'])
            ->name('orders.update-payment-status');
        Route::post('/orders/{order}/resend-wa', [OwnerOrderController::class, 'resendWhatsApp'])
            ->name('orders.resend-wa');
        Route::post('/orders/bulk-resend-wa', [OwnerOrderController::class, 'bulkResendWhatsApp'])
            ->name('orders.bulk-resend-wa');
    });
});
