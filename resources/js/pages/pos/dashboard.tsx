import { useCart } from '@/hooks/use-cart';
import PosLayout from '@/layouts/pos-layout';
import { formatCurrency } from '@/lib/format';
import { Category, Product } from '@/types';
import { Head } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface Props {
    categories: Category[];
    products: Product[];
}

export default function PosDashboard({ categories, products }: Props) {
    const { items: cartItems, addToCart, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [isDirectOrder, setIsDirectOrder] = useState(false);

    // Checkout form state
    const [checkoutForm, setCheckoutForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        shiping_cost: '0',
        notes: '',
    });
    const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesCategory = selectedCategory === null || product.categories_id === selectedCategory;
        const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const shipingCost = Number(checkoutForm.shiping_cost) || 0;
    const grandTotal = subtotal + shipingCost;

    const handleCheckout = async (e: FormEvent) => {
        e.preventDefault();
        setCheckoutErrors({});

        // Validate
        const errors: Record<string, string> = {};
        if (!checkoutForm.customer_name.trim()) {
            errors.customer_name = 'Nama customer harus diisi';
        }
        if (!checkoutForm.customer_phone.trim()) {
            errors.customer_phone = 'No. HP harus diisi';
        }
        if (cartItems.length === 0) {
            errors.cart = 'Keranjang kosong';
        }

        if (Object.keys(errors).length > 0) {
            setCheckoutErrors(errors);
            return;
        }

        setIsSubmitting(true);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

            const response = await fetch('/dashboard/pos/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    customer_name: checkoutForm.customer_name,
                    customer_phone: checkoutForm.customer_phone,
                    customer_address: checkoutForm.customer_address,
                    shiping_cost: shipingCost,
                    notes: checkoutForm.notes,
                    cart_items: cartItems.map((item) => ({
                        product_id: item.product_id,
                        price: item.price,
                        quantity: item.quantity,
                    })),
                    is_direct_order: isDirectOrder,
                }),
            });

            const result = await response.json();

            if (result.success) {
                clearCart();
                setShowCheckout(false);
                setCheckoutForm({
                    customer_name: '',
                    customer_phone: '',
                    customer_address: '',
                    shiping_cost: '0',
                    notes: '',
                });

                const waMessage = result.wa_status === 'SENT' ? '✅ Pesan WhatsApp terkirim!' : '⚠️ Pesan WhatsApp gagal terkirim';

                alert(`Order berhasil dibuat!\n\nOrder ID: ${result.order_id}\n${waMessage}`);
            } else {
                alert('Gagal membuat order: ' + result.message);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Terjadi kesalahan saat checkout');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PosLayout>
            <Head title="POS Dashboard" />

            <div className="flex h-[calc(100vh-56px)]">
                {/* Products Grid */}
                <div className="flex-1 overflow-hidden">
                    {/* Search & Filter */}
                    <div className="border-b bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="🔍 Cari produk..."
                                className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                        selectedCategory === null ? 'bg-[#20477c] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Semua
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                            selectedCategory === cat.id ? 'bg-[#20477c] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="h-[calc(100%-73px)] overflow-y-auto p-4">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="cursor-pointer overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md"
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="aspect-square overflow-hidden">
                                        <img src={`/storage/${product.image_url}`} alt={product.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="truncate font-medium text-gray-900">{product.name}</h3>
                                        <p className="text-sm text-[#20477c]">{formatCurrency(Number(product.price))}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && <div className="py-12 text-center text-gray-500">Tidak ada produk ditemukan</div>}
                    </div>

                    {/* Mobile Cart Floating Button */}
                    <button
                        onClick={() => setShowMobileCart(true)}
                        className="fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#20477c] text-white shadow-lg md:hidden"
                    >
                        <div className="relative">
                            <span className="text-2xl">🛒</span>
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold ring-2 ring-white">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                    </button>
                </div>

                {/* Cart Sidebar */}
                <div
                    className={`flex flex-col border-l bg-white transition-all duration-300 ${
                        showMobileCart ? 'fixed inset-0 z-50 w-full' : 'hidden md:static md:flex md:w-80 lg:w-96'
                    }`}
                >
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="text-lg font-semibold">🛒 Keranjang ({totalItems} item)</h2>
                        <button onClick={() => setShowMobileCart(false)} className="rounded-full p-1 hover:bg-gray-100 md:hidden">
                            <span className="text-xl">✕</span>
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {cartItems.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">Keranjang kosong</div>
                        ) : (
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={item.product_id} className="flex gap-3 rounded-lg border p-3">
                                        <img src={`/storage/${item.image_url}`} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                                            <p className="text-sm text-[#20477c]">{formatCurrency(item.price)}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.product_id)}
                                                    className="ml-auto text-red-500 hover:text-red-700"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Summary */}
                    <div className="border-t p-4">
                        <div className="mb-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setIsDirectOrder(false);
                                setShowCheckout(true);
                            }}
                            disabled={cartItems.length === 0}
                            className="w-full rounded-md bg-[#20477c] py-3 text-white transition-colors hover:bg-[#183660] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Checkout (Kirim)
                        </button>

                        <button
                            onClick={() => {
                                setIsDirectOrder(true);
                                setCheckoutForm((prev) => ({ ...prev, shiping_cost: '0', customer_address: '' }));
                                setShowCheckout(true);
                            }}
                            disabled={cartItems.length === 0}
                            className="mt-2 w-full rounded-md bg-green-600 py-3 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Bayar Langsung
                        </button>

                        {cartItems.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="mt-2 w-full rounded-md border border-gray-300 py-2 text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                Kosongkan Keranjang
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{isDirectOrder ? 'Bayar Langsung' : 'Checkout'}</h2>
                            <button onClick={() => setShowCheckout(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCheckout} className="space-y-4">
                            {/* Customer Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Customer *</label>
                                <input
                                    type="text"
                                    value={checkoutForm.customer_name}
                                    onChange={(e) =>
                                        setCheckoutForm({
                                            ...checkoutForm,
                                            customer_name: e.target.value,
                                        })
                                    }
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                        checkoutErrors.customer_name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nama lengkap customer"
                                />
                                {checkoutErrors.customer_name && <p className="mt-1 text-sm text-red-500">{checkoutErrors.customer_name}</p>}
                            </div>

                            {/* Customer Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">No. HP / WhatsApp *</label>
                                <input
                                    type="tel"
                                    value={checkoutForm.customer_phone}
                                    onChange={(e) =>
                                        setCheckoutForm({
                                            ...checkoutForm,
                                            customer_phone: e.target.value,
                                        })
                                    }
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                        checkoutErrors.customer_phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="08xxxxxxxxxx"
                                />
                                {checkoutErrors.customer_phone && <p className="mt-1 text-sm text-red-500">{checkoutErrors.customer_phone}</p>}
                            </div>

                            {/* Customer Address */}
                            {!isDirectOrder && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Alamat Pengiriman</label>
                                    <textarea
                                        value={checkoutForm.customer_address}
                                        onChange={(e) =>
                                            setCheckoutForm({
                                                ...checkoutForm,
                                                customer_address: e.target.value,
                                            })
                                        }
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#20477c] focus:outline-none"
                                        placeholder="Alamat lengkap (opsional)"
                                    />
                                </div>
                            )}

                            {/* Shiping Cost */}
                            {!isDirectOrder && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ongkos Kirim</label>
                                    <div className="relative mt-1">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">Rp</span>
                                        <input
                                            type="number"
                                            value={checkoutForm.shiping_cost}
                                            onChange={(e) =>
                                                setCheckoutForm({
                                                    ...checkoutForm,
                                                    shiping_cost: e.target.value,
                                                })
                                            }
                                            className="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 focus:ring-2 focus:ring-[#20477c] focus:outline-none"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Catatan</label>
                                <textarea
                                    value={checkoutForm.notes}
                                    onChange={(e) =>
                                        setCheckoutForm({
                                            ...checkoutForm,
                                            notes: e.target.value,
                                        })
                                    }
                                    rows={2}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#20477c] focus:outline-none"
                                    placeholder="Catatan pesanan (opsional)"
                                />
                            </div>

                            {/* Order Summary */}
                            <div className="rounded-md bg-gray-50 p-4">
                                <h3 className="mb-2 font-medium">Ringkasan Pesanan</h3>
                                <div className="space-y-1 text-sm">
                                    {cartItems.map((item) => (
                                        <div key={item.product_id} className="flex justify-between">
                                            <span>
                                                {item.name} x{item.quantity}
                                            </span>
                                            <span>{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 border-t pt-3 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Ongkir</span>
                                        <span>{formatCurrency(shipingCost)}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                                        <span>TOTAL</span>
                                        <span className="text-[#20477c]">{formatCurrency(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            {checkoutErrors.cart && <p className="text-sm text-red-500">{checkoutErrors.cart}</p>}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCheckout(false)}
                                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-md bg-[#20477c] px-4 py-2 text-white transition-colors hover:bg-[#183660] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Memproses...' : 'Proses'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PosLayout>
    );
}
