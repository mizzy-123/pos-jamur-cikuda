import OwnerLayout from '@/layouts/owner-layout';
import { formatCurrency } from '@/lib/format';
import { Category, PaginatedData, Product } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    products: PaginatedData<Product>;
    categories: Category[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}

export default function ProductsIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (key: string, value: string) => {
        router.get('/dashboard/owner/products', { ...filters, [key]: value || undefined, page: 1 }, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('search', search);
    };

    const toggleStatus = async (product: Product) => {
        try {
            await fetch(`/dashboard/owner/products/${product.id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
            });
            router.reload({ only: ['products'] });
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`Yakin hapus produk "${product.name}"?`)) return;

        router.delete(`/dashboard/owner/products/${product.id}`, {
            preserveState: true,
        });
    };

    return (
        <OwnerLayout title="Kelola Produk">
            <Head title="Kelola Produk" />

            {/* Header Actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    href="/dashboard/owner/products/create"
                    className="inline-flex items-center gap-2 rounded-md bg-[#20477c] px-4 py-2 text-white transition-colors hover:bg-[#183660]"
                >
                    <span>+</span> Tambah Produk
                </Link>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <form onSubmit={handleSearch} className="flex">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari produk..."
                            className="rounded-l-md border border-r-0 border-gray-300 px-3 py-2 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                        />
                        <button type="submit" className="rounded-r-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200">
                            🔍
                        </button>
                    </form>

                    <select
                        value={filters.category || ''}
                        onChange={(e) => handleFilter('category', e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilter('status', e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                    >
                        <option value="">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Non-Aktif</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Produk</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Kategori</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Harga</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {products.data.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={`/storage/${product.image_url}`}
                                                alt={product.name}
                                                className="h-10 w-10 rounded-md object-cover"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">{product.category?.name || '-'}</td>
                                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-900">{formatCurrency(Number(product.price))}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => toggleStatus(product)}
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {product.is_active ? '✓ Aktif' : '✗ Non-aktif'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/dashboard/owner/products/${product.id}/edit`}
                                                className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                                            >
                                                ✏️
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {products.data.length === 0 && <div className="py-12 text-center text-gray-500">Tidak ada produk ditemukan</div>}

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                        <div className="text-sm text-gray-700">
                            Menampilkan {products.from} - {products.to} dari {products.total} produk
                        </div>
                        <div className="flex gap-1">
                            {products.links.map((link, index) => (
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
