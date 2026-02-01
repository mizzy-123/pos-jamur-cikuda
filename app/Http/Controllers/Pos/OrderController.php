<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\FonnteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    protected FonnteService $fonnteService;

    public function __construct(FonnteService $fonnteService)
    {
        $this->fonnteService = $fonnteService;
    }

    /**
     * Store a newly created order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:255'],
            'customer_address' => ['nullable', 'string'],
            'shiping_cost' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'cart_items' => ['required', 'array', 'min:1'],
            'cart_items.*.product_id' => ['required', 'uuid', 'exists:products,id'],
            'cart_items.*.price' => ['required', 'numeric', 'min:0'],
            'cart_items.*.quantity' => ['required', 'integer', 'min:1'],
            'is_direct_order' => ['nullable', 'boolean'],
        ]);

        try {
            DB::beginTransaction();

            // Find or create customer
            $customer = Customer::firstOrCreate(
                ['phone_number' => $validated['customer_phone']],
                [
                    'name' => $validated['customer_name'],
                    'address' => $validated['customer_address'],
                ]
            );

            // Update customer info if exists
            if (!$customer->wasRecentlyCreated) {
                $customer->update([
                    'name' => $validated['customer_name'],
                    'address' => $validated['customer_address'] ?? $customer->address,
                ]);
            }

            // Calculate totals
            $totalAmount = 0;
            foreach ($validated['cart_items'] as $item) {
                $totalAmount += $item['price'] * $item['quantity'];
            }

            $shipingCost = $validated['shiping_cost'];
            $grandTotal = $totalAmount + $shipingCost;

            // Create order
            $isDirectOrder = $request->boolean('is_direct_order');

            $order = Order::create([
                'users_id' => auth()->id(),
                'customers_id' => $customer->id,
                'total_amount' => $totalAmount,
                'shiping_cost' => $shipingCost,
                'grand_total' => $grandTotal,
                'payment_status' => $isDirectOrder ? 'PAID' : 'UNPAID',
                'wa_sent_status' => 'PENDING',
                'notes' => $validated['notes'],
            ]);

            // Create order items
            foreach ($validated['cart_items'] as $item) {
                OrderItem::create([
                    'orders_id' => $order->id,
                    'products_id' => $item['product_id'],
                    'price_at_purchase' => $item['price'],
                    'subtotal' => $item['price'] * $item['quantity'],
                ]);
            }

            DB::commit();

            // Send WhatsApp notification
            $waResult = $this->fonnteService->sendOrderNotification($order);

            $order->update(['wa_sent_status' => $waResult['status']]);

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil dibuat',
                'order_id' => $order->id,
                'wa_status' => $waResult['status'],
                'wa_message' => $waResult['message'],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Order creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat order: ' . $e->getMessage(),
            ], 500);
        }
    }
}
