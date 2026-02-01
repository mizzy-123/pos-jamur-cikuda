<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the POS dashboard.
     */
    public function index(): Response
    {
        $categories = Category::active()->get();
        $products = Product::with('category')
            ->active()
            ->orderBy('name')
            ->get();

        return Inertia::render('pos/dashboard', [
            'categories' => $categories,
            'products' => $products,
        ]);
    }
}
