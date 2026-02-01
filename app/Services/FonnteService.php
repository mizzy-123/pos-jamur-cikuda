<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    protected string $apiUrl;
    protected ?string $token;

    public function __construct()
    {
        $this->apiUrl = config('services.fonnte.url', 'https://api.fonnte.com/send');
        $this->token = config('services.fonnte.token');
    }

    /**
     * Send WhatsApp message via Fonnte API
     *
     * @param string $phone Customer phone number
     * @param string $message Message to send
     * @return array{status: string, message: string}
     */
    public function sendMessage(string $phone, string $message): array
    {
        try {
            if (empty($this->token)) {
                Log::warning('Fonnte: Token not configured');
                return [
                    'status' => 'FAILED',
                    'message' => 'Fonnte token not configured',
                ];
            }

            $formattedPhone = $this->formatPhone($phone);

            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post($this->apiUrl, [
                'target' => $formattedPhone,
                'message' => $message,
                'countryCode' => '62',
            ]);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === true) {
                Log::info('Fonnte: Message sent successfully', [
                    'phone' => $formattedPhone,
                ]);

                return [
                    'status' => 'SENT',
                    'message' => 'Message sent successfully',
                ];
            }

            Log::error('Fonnte: Failed to send message', [
                'phone' => $formattedPhone,
                'response' => $result,
            ]);

            return [
                'status' => 'FAILED',
                'message' => $result['reason'] ?? 'Failed to send message',
            ];
        } catch (\Exception $e) {
            Log::error('Fonnte: Exception occurred', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'FAILED',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Format phone number to Indonesian format (62xxx)
     */
    public function formatPhone(string $phone): string
    {
        // Remove non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Remove leading zeros
        $phone = ltrim($phone, '0');

        // Add country code if not present
        if (!str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }

        return $phone;
    }

    /**
     * Build order notification message
     */
    public function buildOrderMessage(Order $order): string
    {
        $order->load(['customer', 'items.product']);

        $message = "Halo *{$order->customer->name}*! 👋\n\n";
        $message .= "Terima kasih sudah order di *Jamur Cikuda Nusantara*\n\n";
        $message .= "📋 *Detail Pesanan*\n";
        $message .= "Order ID: {$order->id}\n";
        $message .= "Tanggal: {$order->created_at->format('d M Y H:i')}\n\n";
        $message .= "🛒 *Produk yang dipesan:*\n";

        foreach ($order->items as $item) {
            $qty = $item->quantity;
            $message .= "- {$item->product->name} x{$qty} = Rp " . number_format($item->subtotal, 0, ',', '.') . "\n";
        }

        $message .= "\n💰 *Total Pembayaran*\n";
        $message .= "Subtotal: Rp " . number_format($order->total_amount, 0, ',', '.') . "\n";
        $message .= "Ongkir: Rp " . number_format($order->shiping_cost, 0, ',', '.') . "\n";
        $message .= "*TOTAL: Rp " . number_format($order->grand_total, 0, ',', '.') . "*\n\n";

        if ($order->customer->address) {
            $message .= "📍 Alamat Pengiriman:\n{$order->customer->address}\n\n";
        }

        if ($order->payment_status === 'PAID') {
            $message .= "✅ *LUNAS* - Terima kasih sudah berbelanja! 🙏";
        } else {
            $message .= "Mohon segera lakukan pembayaran ya! 🙏";
        }

        return $message;
    }

    /**
     * Send order notification to customer
     */
    public function sendOrderNotification(Order $order): array
    {
        $message = $this->buildOrderMessage($order);
        return $this->sendMessage($order->customer->phone_number, $message);
    }
}
