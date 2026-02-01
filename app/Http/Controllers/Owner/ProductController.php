<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request): Response
    {
        $query = Product::with('category');

        // Search
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('categories_id', $request->category);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $products = $query->orderBy('name')->paginate(10)->withQueryString();
        $categories = Category::all();

        return Inertia::render('owner/products/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(): Response
    {
        $categories = Category::active()->get();

        return Inertia::render('owner/products/create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'categories_id' => ['required', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active' => ['boolean'],
        ]);

        $imagePath = $request->file('image')->store('products', 'public');

        Product::create([
            'name' => $validated['name'],
            'categories_id' => $validated['categories_id'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'image_url' => $imagePath,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('owner.products.index')
            ->with('success', 'Produk berhasil ditambahkan');
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): Response
    {
        $categories = Category::active()->get();

        return Inertia::render('owner/products/edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'categories_id' => ['required', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active' => ['boolean'],
        ]);

        $data = [
            'name' => $validated['name'],
            'categories_id' => $validated['categories_id'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'is_active' => $validated['is_active'] ?? true,
        ];

        if ($request->hasFile('image')) {
            // Delete old image
            if ($product->image_url) {
                Storage::disk('public')->delete($product->image_url);
            }
            $data['image_url'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);

        return redirect()->route('owner.products.index')
            ->with('success', 'Produk berhasil diperbarui');
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): RedirectResponse|JsonResponse
    {
        // Check if product has orders
        if ($product->orderItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak dapat dihapus karena sudah ada di pesanan. Nonaktifkan saja.',
            ], 422);
        }

        // Delete image
        if ($product->image_url) {
            Storage::disk('public')->delete($product->image_url);
        }

        $product->delete();

        return redirect()->route('owner.products.index')
            ->with('success', 'Produk berhasil dihapus');
    }

    /**
     * Toggle product active status.
     */
    public function toggleStatus(Product $product): JsonResponse
    {
        $product->update(['is_active' => !$product->is_active]);

        return response()->json([
            'success' => true,
            'is_active' => $product->is_active,
            'message' => $product->is_active ? 'Produk diaktifkan' : 'Produk dinonaktifkan',
        ]);
    }
}
