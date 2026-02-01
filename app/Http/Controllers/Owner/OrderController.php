<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\FonnteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    protected FonnteService $fonnteService;

    public function __construct(FonnteService $fonnteService)
    {
        $this->fonnteService = $fonnteService;
    }

    /**
     * Display a listing of orders.
     */
    public function index(Request $request): Response
    {
        $query = Order::with(['customer', 'user', 'items.product']);

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by WA status
        if ($request->filled('wa_status')) {
            $query->where('wa_sent_status', $request->wa_status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search by customer name or order ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', '%' . $search . '%')
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', '%' . $search . '%')
                            ->orWhere('phone_number', 'like', '%' . $search . '%');
                    });
            });
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('owner/orders/index', [
            'orders' => $orders,
            'filters' => $request->only(['payment_status', 'wa_status', 'date_from', 'date_to', 'search']),
        ]);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order): Response
    {
        $order->load(['customer', 'user', 'items.product']);

        return Inertia::render('owner/orders/show', [
            'order' => $order,
        ]);
    }

    /**
     * Update order payment status.
     */
    public function updatePaymentStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'payment_status' => ['required', 'in:UNPAID,PAID,CANCELLED'],
        ]);

        $order->update(['payment_status' => $validated['payment_status']]);

        return response()->json([
            'success' => true,
            'message' => 'Status pembayaran berhasil diperbarui',
            'payment_status' => $order->payment_status,
        ]);
    }

    /**
     * Resend WhatsApp notification.
     */
    public function resendWhatsApp(Order $order): JsonResponse
    {
        $result = $this->fonnteService->sendOrderNotification($order);

        $order->update(['wa_sent_status' => $result['status']]);

        return response()->json([
            'success' => $result['status'] === 'SENT',
            'message' => $result['message'],
            'wa_status' => $result['status'],
        ]);
    }

    /**
     * Bulk resend failed WhatsApp messages.
     */
    public function bulkResendWhatsApp(): JsonResponse
    {
        $failedOrders = Order::where('wa_sent_status', 'FAILED')->get();

        $success = 0;
        $failed = 0;

        foreach ($failedOrders as $order) {
            $result = $this->fonnteService->sendOrderNotification($order);
            $order->update(['wa_sent_status' => $result['status']]);

            if ($result['status'] === 'SENT') {
                $success++;
            } else {
                $failed++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "{$success} berhasil, {$failed} gagal",
            'sent' => $success,
            'failed' => $failed,
        ]);
    }
}
