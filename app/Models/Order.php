<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'shiping_cost' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    /**
     * Get the user (cashier) who handled this order
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'users_id');
    }

    /**
     * Get the customer who placed this order
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customers_id');
    }

    /**
     * Get items in this order
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'orders_id');
    }

    /**
     * Scope for unpaid orders
     */
    public function scopeUnpaid($query)
    {
        return $query->where('payment_status', 'UNPAID');
    }

    /**
     * Scope for failed WhatsApp sends
     */
    public function scopeWaFailed($query)
    {
        return $query->where('wa_sent_status', 'FAILED');
    }
}
