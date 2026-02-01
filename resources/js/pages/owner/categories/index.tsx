import OwnerLayout from '@/layouts/owner-layout';
import type { Category } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface CategoryWithCount extends Category {
    products_count: number;
}

interface Props {
    categories: CategoryWithCount[];
}

export default function CategoriesIndex({ categories }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        is_active: true,
    });

    const handleCreate = (e: FormEvent) => {
        e.preventDefault();
        post('/dashboard/owner/categories', {
            onSuccess: () => {
                reset();
                setShowModal(false);
            },
        });
    };

    const handleEdit = (category: CategoryWithCount) => {
        setEditingId(category.id);
        editForm.setData({
            name: category.name,
            is_active: category.is_active,
        });
    };

    const handleUpdate = (e: FormEvent, id: number) => {
        e.preventDefault();
        editForm.put(`/dashboard/owner/categories/${id}`, {
            onSuccess: () => {
                setEditingId(null);
            },
        });
    };

    const handleDelete = async (category: CategoryWithCount) => {
        if (category.products_count > 0) {
            alert('Kategori tidak dapat dihapus karena masih memiliki produk');
            return;
        }
        if (!confirm(`Yakin hapus kategori "${category.name}"?`)) return;

        router.delete(`/dashboard/owner/categories/${category.id}`);
    };

    const toggleStatus = async (category: CategoryWithCount) => {
        try {
            await fetch(`/dashboard/owner/categories/${category.id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                    Accept: 'application/json',
                },
            });
            router.reload({ only: ['categories'] });
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    return (
        <OwnerLayout title="Kelola Kategori">
            <Head title="Kelola Kategori" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600">Total: {categories.length} kategori</p>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#20477c] px-4 py-2 text-white transition-colors hover:bg-[#183660]"
                >
                    <span>+</span> Tambah Kategori
                </button>
            </div>

            {/* Categories Table */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Nama Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Jumlah Produk</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === category.id ? (
                                        <form onSubmit={(e) => handleUpdate(e, category.id)} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editForm.data.name}
                                                onChange={(e) => editForm.setData('name', e.target.value)}
                                                className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#20477c] focus:ring-1 focus:ring-[#20477c] focus:outline-none"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={editForm.processing}
                                                className="rounded bg-green-100 px-2 py-1 text-green-600 hover:bg-green-200"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="rounded bg-gray-100 px-2 py-1 text-gray-600 hover:bg-gray-200"
                                            >
                                                ✕
                                            </button>
                                        </form>
                                    ) : (
                                        <span className="font-medium text-gray-900">{category.name}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{category.products_count} produk</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => toggleStatus(category)}
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                            category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {category.is_active ? '✓ Aktif' : '✗ Non-aktif'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category)}
                                            className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200"
                                            disabled={category.products_count > 0}
                                            title={category.products_count > 0 ? 'Tidak dapat dihapus karena masih memiliki produk' : undefined}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {categories.length === 0 && <div className="py-12 text-center text-gray-500">Belum ada kategori</div>}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Tambah Kategori</h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    reset();
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Kategori *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                        errors.name ? 'border-red-500' : 'border-gray-300 focus:border-[#20477c]'
                                    }`}
                                    placeholder="Masukkan nama kategori"
                                    autoFocus
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#20477c] focus:ring-[#20477c]"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">
                                    Kategori Aktif
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        reset();
                                    }}
                                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-md bg-[#20477c] px-4 py-2 text-white transition-colors hover:bg-[#183660] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}
