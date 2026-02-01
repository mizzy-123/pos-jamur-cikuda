<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'price_at_purchase' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    protected $appends = ['quantity'];

    /**
     * Get the order this item belongs to
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'orders_id');
    }

    /**
     * Get the product in this order item
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'products_id');
    }

    /**
     * Calculate quantity from subtotal / price_at_purchase
     */
    public function getQuantityAttribute(): int
    {
        if ($this->price_at_purchase == 0) {
            return 0;
        }
        return (int) ($this->subtotal / $this->price_at_purchase);
    }
}
