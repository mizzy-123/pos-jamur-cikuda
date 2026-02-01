import OwnerLayout from '@/layouts/owner-layout';
import { formatCurrency } from '@/lib/format';
import { DashboardStats, RevenueChartData } from '@/types';
import { Head } from '@inertiajs/react';

interface Props {
    stats: DashboardStats;
    revenueChart: RevenueChartData[];
}

export default function OwnerDashboard({ stats, revenueChart }: Props) {
    const statCards = [
        {
            icon: '💰',
            title: 'Penjualan Hari Ini',
            value: formatCurrency(stats.todaySales),
            color: 'bg-green-500',
        },
        {
            icon: '📦',
            title: 'Total Order Hari Ini',
            value: `${stats.todayOrders} pesanan`,
            color: 'bg-blue-500',
        },
        {
            icon: '⏳',
            title: 'Pembayaran Pending',
            value: `${stats.pendingPayments} order`,
            color: 'bg-yellow-500',
        },
        {
            icon: '❌',
            title: 'WA Gagal Terkirim',
            value: `${stats.failedWa} order`,
            color: 'bg-red-500',
        },
    ];

    // Find max revenue for chart scaling
    const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue), 1);

    return (
        <OwnerLayout title="Dashboard Owner">
            <Head title="Dashboard Owner" />

            {/* Stats Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card, index) => (
                    <div key={index} className="rounded-lg bg-white p-6 shadow">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.color} text-2xl`}>{card.icon}</div>
                            <div>
                                <p className="text-sm text-gray-500">{card.title}</p>
                                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue Chart (7 Hari Terakhir)</h2>
                {revenueChart.length > 0 ? (
                    <div className="flex h-64 items-end gap-2">
                        {revenueChart.map((data, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center">
                                <div
                                    className="w-full rounded-t bg-[#20477c] transition-all hover:bg-[#2a5a9e]"
                                    style={{
                                        height: `${(data.revenue / maxRevenue) * 200}px`,
                                        minHeight: data.revenue > 0 ? '20px' : '4px',
                                    }}
                                    title={`${formatCurrency(data.revenue)} (${data.orders} orders)`}
                                />
                                <div className="mt-2 text-center">
                                    <p className="text-xs text-gray-500">
                                        {new Date(data.date).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                        })}
                                    </p>
                                    <p className="text-xs font-medium text-gray-700">{formatCurrency(data.revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-8 text-center text-gray-500">Belum ada data penjualan dalam 7 hari terakhir</p>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <a
                    href="/dashboard/owner/orders"
                    className="flex items-center gap-3 rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
                >
                    <span className="text-2xl">📋</span>
                    <span className="font-medium">Lihat Semua Pesanan</span>
                </a>
                <a
                    href="/dashboard/owner/products"
                    className="flex items-center gap-3 rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
                >
                    <span className="text-2xl">📦</span>
                    <span className="font-medium">Kelola Produk</span>
                </a>
                <a
                    href="/dashboard/owner/orders?wa_status=FAILED"
                    className="flex items-center gap-3 rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
                >
                    <span className="text-2xl">📱</span>
                    <span className="font-medium">WA Gagal Terkirim</span>
                </a>
            </div>
        </OwnerLayout>
    );
}
