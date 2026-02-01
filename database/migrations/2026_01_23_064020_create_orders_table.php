<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('users_id');
            $table->foreign('users_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('customers_id');
            $table->foreign('customers_id')->references('id')->on('customers')->onDelete('cascade');
            $table->decimal('total_amount', 12, 2);
            $table->decimal('shiping_cost', 10, 2)->default(0);
            $table->decimal('grand_total', 12, 2);
            $table->enum('payment_status', ['UNPAID', 'PAID', 'CANCELLED'])->default('UNPAID');
            $table->enum('wa_sent_status', ['PENDING', 'SENT', 'FAILED'])->default('PENDING');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
