<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the owner dashboard with statistics.
     */
    public function index(): Response
    {
        $today = now()->startOfDay();

        // Today's statistics
        $todaySales = Order::whereDate('created_at', $today)
            ->where('payment_status', '!=', 'CANCELLED')
            ->sum('grand_total');

        $todayOrders = Order::whereDate('created_at', $today)
            ->where('payment_status', '!=', 'CANCELLED')
            ->count();

        $pendingPayments = Order::where('payment_status', 'UNPAID')->count();

        $failedWa = Order::where('wa_sent_status', 'FAILED')->count();

        // Last 7 days revenue for chart
        $revenueChart = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->where('payment_status', '!=', 'CANCELLED')
            ->where('created_at', '>=', now()->subDays(7)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('owner/dashboard', [
            'stats' => [
                'todaySales' => (float) $todaySales,
                'todayOrders' => $todayOrders,
                'pendingPayments' => $pendingPayments,
                'failedWa' => $failedWa,
            ],
            'revenueChart' => $revenueChart,
        ]);
    }
}
