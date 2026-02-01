import OwnerLayout from '@/layouts/owner-layout';
import { formatCurrency, formatDate } from '@/lib/format';
import { Order, PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    orders: PaginatedData<Order>;
    filters: {
        payment_status?: string;
        wa_status?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
}

export default function OrdersIndex({ orders, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (key: string, value: string) => {
        router.get('/dashboard/owner/orders', { ...filters, [key]: value || undefined, page: 1 }, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('search', search);
    };

    const updatePaymentStatus = async (order: Order, status: string) => {
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
                router.reload({ only: ['orders'] });
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const resendWhatsApp = async (order: Order) => {
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
            router.reload({ only: ['orders'] });
        } catch (error) {
            console.error('Failed to resend WA:', error);
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        const styles = {
            UNPAID: 'bg-yellow-100 text-yellow-800',
            PAID: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };
        const labels = {
            UNPAID: '⏳ Belum Bayar',
            PAID: '💰 Lunas',
            CANCELLED: '❌ Batal',
        };
        return (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    const getWaStatusBadge = (status: string) => {
        const styles = {
            PENDING: 'bg-gray-100 text-gray-800',
            SENT: 'bg-green-100 text-green-800',
            FAILED: 'bg-red-100 text-red-800',
        };
        const labels = {
            PENDING: '⏳ Pending',
            SENT: '✓ Terkirim',
            FAILED: '❌ Gagal',
        };
        return (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    return (
        <OwnerLayout title="Kelola Pesanan">
            <Head title="Kelola Pesanan" />

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
                <form onSubmit={handleSearch} className="flex">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ID/Customer..."
                        className="rounded-l-md border border-r-0 border-gray-300 px-3 py-2 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                    />
                    <button type="submit" className="rounded-r-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200">
                        🔍
                    </button>
                </form>

                <select
                    value={filters.payment_status || ''}
                    onChange={(e) => handleFilter('payment_status', e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                >
                    <option value="">Semua Status Bayar</option>
                    <option value="UNPAID">Belum Bayar</option>
                    <option value="PAID">Lunas</option>
                    <option value="CANCELLED">Batal</option>
                </select>

                <select
                    value={filters.wa_status || ''}
                    onChange={(e) => handleFilter('wa_status', e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                >
                    <option value="">Semua Status WA</option>
                    <option value="SENT">Terkirim</option>
                    <option value="FAILED">Gagal</option>
                    <option value="PENDING">Pending</option>
                </select>

                <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => handleFilter('date_from', e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                />
                <input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => handleFilter('date_to', e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                />
            </div>

            {/* Orders Table */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Pembayaran</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">WhatsApp</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Tanggal</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {orders.data.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 font-mono text-sm whitespace-nowrap text-gray-900">{order.id.substring(0, 8)}...</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="font-medium text-gray-900">{order.customer?.name}</p>
                                            <p className="text-sm text-gray-500">{order.customer?.phone_number}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                                        {formatCurrency(Number(order.grand_total))}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <select
                                            value={order.payment_status}
                                            onChange={(e) => updatePaymentStatus(order, e.target.value)}
                                            className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                                        >
                                            <option value="UNPAID">⏳ Belum Bayar</option>
                                            <option value="PAID">💰 Lunas</option>
                                            <option value="CANCELLED">❌ Batal</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getWaStatusBadge(order.wa_sent_status)}
                                            {order.wa_sent_status === 'FAILED' && (
                                                <button
                                                    onClick={() => resendWhatsApp(order)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Kirim ulang"
                                                >
                                                    🔄
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">{formatDate(order.created_at)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/dashboard/owner/orders/${order.id}`}
                                            className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                                        >
                                            👁️ Detail
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {orders.data.length === 0 && <div className="py-12 text-center text-gray-500">Tidak ada pesanan ditemukan</div>}

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                        <div className="text-sm text-gray-700">
                            Menampilkan {orders.from} - {orders.to} dari {orders.total} pesanan
                        </div>
                        <div className="flex gap-1">
                            {orders.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-[#20477c] text-white'
                                            : link.url
                                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                              : 'cursor-not-allowed bg-gray-50 text-gray-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
}
