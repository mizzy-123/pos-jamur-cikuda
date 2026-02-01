# Fonnte WhatsApp Gateway Integration Guide

## Overview

Aplikasi POS Jamur Cikuda Nusantara menggunakan **Fonnte** sebagai WhatsApp Gateway untuk mengirim notifikasi order otomatis kepada customer.

**Fonnte Website:** https://fonnte.com  
**API Documentation:** https://docs.fonnte.com

---

## 1. Setup & Configuration

### 1.1 Registrasi Fonnte

1. Daftar akun di https://fonnte.com
2. Hubungkan WhatsApp Business/Personal ke Fonnte
3. Dapatkan **API Token** dari dashboard Fonnte
4. Copy token untuk konfigurasi Laravel

### 1.2 Environment Configuration

Tambahkan konfigurasi berikut ke file `.env`:

```env
# Fonnte WhatsApp Gateway
FONNTE_API_URL=https://api.fonnte.com/send
FONNTE_TOKEN=your_fonnte_api_token_here
```

### 1.3 Config Service Provider

Buat atau update `config/services.php`:

```php
return [
    // ... existing services

    'fonnte' => [
        'url' => env('FONNTE_API_URL', 'https://api.fonnte.com/send'),
        'token' => env('FONNTE_TOKEN'),
    ],
];
```

---

## 2. Implementation

### 2.1 Fonnte Service Class

Create: `app/Services/FonnteService.php`

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    protected $apiUrl;
    protected $token;

    public function __construct()
    {
        $this->apiUrl = config('services.fonnte.url');
        $this->token = config('services.fonnte.token');
    }

    /**
     * Send WhatsApp message via Fonnte API
     *
     * @param string $phone Customer phone number
     * @param string $message Message content
     * @return array ['status' => 'SENT|FAILED', 'response' => array|string]
     */
    public function sendMessage($phone, $message)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post($this->apiUrl, [
                'target' => $this->formatPhone($phone),
                'message' => $message,
                'countryCode' => '62', // Indonesia
            ]);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('Fonnte message sent successfully', [
                    'phone' => $phone,
                    'response' => $data,
                ]);

                return [
                    'status' => 'SENT',
                    'response' => $data,
                    'message_id' => $data['id'] ?? null,
                ];
            }

            Log::error('Fonnte API failed', [
                'phone' => $phone,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'status' => 'FAILED',
                'error' => $response->body(),
            ];
        } catch (\Exception $e) {
            Log::error('Fonnte API exception', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'FAILED',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Format phone number for Indonesian numbers
     * Converts 08xxx to 628xxx
     *
     * @param string $phone
     * @return string
     */
    protected function formatPhone($phone)
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Remove leading 0 and add country code
        if (substr($phone, 0, 1) === '0') {
            $phone = '62' . substr($phone, 1);
        }

        // If already has 62, keep it
        if (substr($phone, 0, 2) !== '62') {
            $phone = '62' . $phone;
        }

        return $phone;
    }

    /**
     * Build order notification message
     *
     * @param \App\Models\Order $order
     * @return string
     */
    public function buildOrderMessage($order)
    {
        $customer = $order->customer;
        $message = "Halo *{$customer->name}*! 👋\n\n";
        $message .= "Terima kasih sudah order di *Jamur Cikuda Nusantara*\n\n";
        $message .= "📋 *Detail Pesanan*\n";
        $message .= "Order ID: {$order->id}\n";
        $message .= "Tanggal: {$order->created_at->format('d M Y H:i')}\n\n";
        $message .= "🛒 *Produk yang dipesan:*\n";

        foreach ($order->items as $item) {
            $message .= "- {$item->product->name} x{$item->quantity} = Rp "
                     . number_format($item->subtotal, 0, ',', '.') . "\n";
        }

        $message .= "\n💰 *Total Pembayaran*\n";
        $message .= "Subtotal: Rp " . number_format($order->total_amount, 0, ',', '.') . "\n";
        $message .= "Ongkir: Rp " . number_format($order->shiping_cost, 0, ',', '.') . "\n";
        $message .= "*TOTAL: Rp " . number_format($order->grand_total, 0, ',', '.') . "*\n\n";

        if ($customer->address) {
            $message .= "📍 Alamat Pengiriman:\n{$customer->address}\n\n";
        }

        $message .= "Mohon segera lakukan pembayaran ya! 🙏\n";
        $message .= "Terima kasih! 😊";

        return $message;
    }
}
```

### 2.2 Order Controller Integration

Update `app/Http/Controllers/OrderController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Services\FonnteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    protected $fonnteService;

    public function __construct(FonnteService $fonnteService)
    {
        $this->fonnteService = $fonnteService;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_address' => 'nullable|string',
            'cart_items' => 'required|array|min:1',
            'cart_items.*.product_id' => 'required|uuid|exists:products,id',
            'cart_items.*.quantity' => 'required|integer|min:1',
            'cart_items.*.price' => 'required|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // 1. Check or create customer
            $customer = Customer::firstOrCreate(
                ['phone_number' => $validated['customer_phone']],
                [
                    'id' => Str::uuid(),
                    'name' => $validated['customer_name'],
                    'address' => $validated['customer_address'] ?? null,
                ]
            );

            // 2. Calculate totals
            $totalAmount = collect($validated['cart_items'])->sum(function ($item) {
                return $item['price'] * $item['quantity'];
            });
            $shippingCost = $validated['shipping_cost'] ?? 0;
            $grandTotal = $totalAmount + $shippingCost;

            // 3. Create order
            $order = Order::create([
                'id' => Str::uuid(),
                'users_id' => auth()->id(),
                'customers_id' => $customer->id,
                'total_amount' => $totalAmount,
                'shiping_cost' => $shippingCost,
                'grand_total' => $grandTotal,
                'payment_status' => 'UNPAID',
                'wa_sent_status' => 'PENDING',
                'notes' => $validated['notes'] ?? null,
            ]);

            // 4. Create order items
            foreach ($validated['cart_items'] as $item) {
                $order->items()->create([
                    'id' => Str::uuid(),
                    'products_id' => $item['product_id'],
                    'price_at_purchase' => $item['price'],
                    'subtotal' => $item['price'] * $item['quantity'],
                    'quantity' => $item['quantity'], // if you have this column
                ]);
            }

            DB::commit();

            // 5. Send WhatsApp notification via Fonnte
            $message = $this->fonnteService->buildOrderMessage($order->load('items.product', 'customer'));
            $waResult = $this->fonnteService->sendMessage($customer->phone_number, $message);

            // 6. Update wa_sent_status based on result
            $order->update([
                'wa_sent_status' => $waResult['status'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil dibuat',
                'order' => $order,
                'wa_status' => $waResult['status'],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat order: ' . $e->getMessage(),
            ], 500);
        }
    }
}
```

---

## 3. API Response Examples

### 3.1 Success Response (Fonnte)

```json
{
    "status": true,
    "id": "ABCD1234567890",
    "message": "Message sent successfully"
}
```

### 3.2 Error Response (Fonnte)

```json
{
    "status": false,
    "reason": "Invalid token"
}
```

### 3.3 Application Response (Order Created)

```json
{
    "success": true,
    "message": "Order berhasil dibuat",
    "order": {
        "id": "9a12b3c4-...",
        "customers_id": "8b23c4d5-...",
        "grand_total": 150000,
        "wa_sent_status": "SENT"
    },
    "wa_status": "SENT"
}
```

---

## 4. Error Handling

### 4.1 Common Errors

| Error                | Cause                 | Solution                             |
| -------------------- | --------------------- | ------------------------------------ |
| Invalid token        | Wrong API token       | Check `.env` FONNTE_TOKEN            |
| Device not connected | WhatsApp disconnected | Reconnect device in Fonnte dashboard |
| Invalid phone number | Wrong format          | Ensure formatPhone() works correctly |
| Rate limit exceeded  | Too many requests     | Implement queue/delay                |
| Insufficient quota   | Out of credits        | Top up Fonnte balance                |

### 4.2 Retry Mechanism (Optional)

Create a job for failed messages:

```php
// app/Jobs/RetryWhatsAppNotification.php
<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\FonnteService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RetryWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $order;
    public $tries = 3; // Retry 3 times

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function handle(FonnteService $fonnteService)
    {
        if ($this->order->wa_sent_status === 'FAILED') {
            $message = $fonnteService->buildOrderMessage($this->order);
            $result = $fonnteService->sendMessage(
                $this->order->customer->phone_number,
                $message
            );

            $this->order->update([
                'wa_sent_status' => $result['status'],
            ]);
        }
    }
}
```

Usage in controller:

```php
use App\Jobs\RetryWhatsAppNotification;

// If initial send failed, dispatch job
if ($waResult['status'] === 'FAILED') {
    RetryWhatsAppNotification::dispatch($order)->delay(now()->addMinutes(5));
}
```

---

## 5. Testing

### 5.1 Manual Testing

```bash
# Test from tinker
php artisan tinker

>>> $service = new App\Services\FonnteService();
>>> $service->sendMessage('08123456789', 'Test message from POS');
```

### 5.2 Unit Test Example

```php
// tests/Unit/FonnteServiceTest.php
<?php

namespace Tests\Unit;

use App\Services\FonnteService;
use Tests\TestCase;

class FonnteServiceTest extends TestCase
{
    public function test_phone_format_conversion()
    {
        $service = new FonnteService();
        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('formatPhone');
        $method->setAccessible(true);

        $this->assertEquals('628123456789', $method->invoke($service, '08123456789'));
        $this->assertEquals('628123456789', $method->invoke($service, '628123456789'));
        $this->assertEquals('628123456789', $method->invoke($service, '+62 812-3456-789'));
    }
}
```

---

## 6. Monitoring & Logs

### 6.1 View Logs

```bash
# Laravel logs
tail -f storage/logs/laravel.log | grep Fonnte

# Check specific date
cat storage/logs/laravel-2026-01-23.log | grep "Fonnte"
```

### 6.2 Dashboard Query (Owner)

Show failed WA messages for manual retry:

```sql
SELECT
    o.id,
    o.created_at,
    c.name,
    c.phone_number,
    o.wa_sent_status,
    o.grand_total
FROM orders o
JOIN customers c ON o.customers_id = c.id
WHERE o.wa_sent_status = 'FAILED'
ORDER BY o.created_at DESC;
```

---

## 7. Best Practices

### ✅ DO's

- Always validate phone numbers before sending
- Log all API requests and responses
- Update `wa_sent_status` immediately after API call
- Use queue for high-volume scenarios
- Implement retry mechanism for failed sends
- Monitor Fonnte quota regularly
- Test with real numbers in staging environment

### ❌ DON'Ts

- Don't hardcode API token in code
- Don't send messages without user consent
- Don't ignore failed send status
- Don't exceed Fonnte rate limits
- Don't expose customer phone numbers in logs
- Don't send spam messages

---

## 8. Troubleshooting

### Problem: "Device not connected"

**Solution:**

1. Login to Fonnte dashboard
2. Check WhatsApp connection status
3. Scan QR code if disconnected
4. Restart WhatsApp application

### Problem: Messages not delivered

**Solution:**

1. Check phone number format (must start with 62)
2. Verify customer number is valid WhatsApp account
3. Check Fonnte quota/balance
4. Review API response in logs

### Problem: API timeout

**Solution:**

1. Increase HTTP timeout in service
2. Use queue for sending
3. Check network connectivity
4. Contact Fonnte support

---

## 9. Resources

- **Fonnte Dashboard:** https://app.fonnte.com
- **API Documentation:** https://docs.fonnte.com
- **Support:** support@fonnte.com
- **WhatsApp Business API Limits:** https://developers.facebook.com/docs/whatsapp/pricing

---

**Version:** 1.0  
**Last Updated:** January 23, 2026  
**Maintained By:** Development Team
