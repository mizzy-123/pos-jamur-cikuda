import OwnerLayout from '@/layouts/owner-layout';
import { formatCurrency, formatDate } from '@/lib/format';
import { Order } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
    order: Order;
}

export default function OrderShow({ order }: Props) {
    const updatePaymentStatus = async (status: string) => {
        try {
            const response = await fetch(`/dashboard/owner/orders/${order.id}/payment-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ payment_status: status }),
            });
            if (response.ok) {
                router.reload();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const resendWhatsApp = async () => {
        try {
            const response = await fetch(`/dashboard/owner/orders/${order.id}/resend-wa`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
            });
            const result = await response.json();
            alert(result.message);
            router.reload();
        } catch (error) {
            console.error('Failed to resend WA:', error);
        }
    };

    return (
        <OwnerLayout title={`Detail Pesanan #${order.id.substring(0, 8)}`}>
            <Head title={`Pesanan #${order.id.substring(0, 8)}`} />

            <div className="mb-4">
                <Link href="/dashboard/owner/orders" className="text-[#20477c] hover:underline">
                    ← Kembali ke Daftar Pesanan
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Order Info */}
                <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold">📋 Detail Pesanan</h2>

                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-gray-500">Order ID</p>
                            <p className="font-mono font-medium">{order.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tanggal</p>
                            <p className="font-medium">{formatDate(order.created_at)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Kasir</p>
                            <p className="font-medium">{order.user?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Catatan</p>
                            <p className="font-medium">{order.notes || '-'}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <h3 className="mb-3 font-semibold">🛒 Produk yang Dipesan</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {order.items?.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2 whitespace-nowrap">{item.product?.name || 'Produk Dihapus'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(Number(item.price_at_purchase))}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{item.quantity}x</td>
                                        <td className="px-4 py-2 font-medium whitespace-nowrap">{formatCurrency(Number(item.subtotal))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-4 border-t pt-4">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{formatCurrency(Number(order.total_amount))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Ongkir</span>
                            <span>{formatCurrency(Number(order.shiping_cost))}</span>
                        </div>
                        <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
                            <span>Total</span>
                            <span className="text-[#20477c]">{formatCurrency(Number(order.grand_total))}</span>
                        </div>
                    </div>
                </div>

                {/* Customer & Status */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-semibold">👤 Info Customer</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Nama</p>
                                <p className="font-medium">{order.customer?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">No. HP</p>
                                <p className="font-medium">{order.customer?.phone_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Alamat</p>
                                <p className="font-medium">{order.customer?.address || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-semibold">📊 Status</h2>

                        <div className="space-y-4">
                            <div>
                                <p className="mb-2 text-sm text-gray-500">Status Pembayaran</p>
                                <select
                                    value={order.payment_status}
                                    onChange={(e) => updatePaymentStatus(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                                >
                                    <option value="UNPAID">⏳ Belum Bayar</option>
                                    <option value="PAID">💰 Lunas</option>
                                    <option value="CANCELLED">❌ Batal</option>
                                </select>
                            </div>

                            <div>
                                <p className="mb-2 text-sm text-gray-500">Status WhatsApp</p>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                                            order.wa_sent_status === 'SENT'
                                                ? 'bg-green-100 text-green-800'
                                                : order.wa_sent_status === 'FAILED'
                                                  ? 'bg-red-100 text-red-800'
                                                  : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {order.wa_sent_status === 'SENT'
                                            ? '✓ Terkirim'
                                            : order.wa_sent_status === 'FAILED'
                                              ? '❌ Gagal'
                                              : '⏳ Pending'}
                                    </span>
                                    {order.wa_sent_status === 'FAILED' && (
                                        <button
                                            onClick={resendWhatsApp}
                                            className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-600 hover:bg-blue-200"
                                        >
                                            🔄 Kirim Ulang
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OwnerLayout>
    );
}
