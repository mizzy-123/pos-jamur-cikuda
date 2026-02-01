import OwnerLayout from '@/layouts/owner-layout';
import { Category, Product } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    product: Product;
    categories: Category[];
}

export default function ProductEdit({ product, categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: product.name,
        categories_id: String(product.categories_id),
        description: product.description,
        price: String(product.price),
        image: null as File | null,
        is_active: product.is_active,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/dashboard/owner/products/${product.id}`, {
            forceFormData: true,
        });
    };

    return (
        <OwnerLayout title="Edit Produk">
            <Head title="Edit Produk" />

            <div className="mx-auto max-w-2xl">
                <div className="rounded-lg bg-white p-6 shadow">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Produk *</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                    errors.name ? 'border-red-500' : 'border-gray-300 focus:border-[#20477c]'
                                }`}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kategori *</label>
                            <select
                                value={data.categories_id}
                                onChange={(e) => setData('categories_id', e.target.value)}
                                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                    errors.categories_id ? 'border-red-500' : 'border-gray-300 focus:border-[#20477c]'
                                }`}
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.categories_id && <p className="mt-1 text-sm text-red-500">{errors.categories_id}</p>}
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Harga *</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">Rp</span>
                                <input
                                    type="number"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    className={`block w-full rounded-md border py-2 pr-3 pl-10 shadow-sm focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                        errors.price ? 'border-red-500' : 'border-gray-300 focus:border-[#20477c]'
                                    }`}
                                    min="0"
                                />
                            </div>
                            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Deskripsi *</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={4}
                                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                    errors.description ? 'border-red-500' : 'border-gray-300 focus:border-[#20477c]'
                                }`}
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                        </div>

                        {/* Current Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gambar Saat Ini</label>
                            <img src={`/storage/${product.image_url}`} alt={product.name} className="mt-2 h-32 w-32 rounded-md object-cover" />
                        </div>

                        {/* New Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ganti Gambar (Opsional)</label>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-[#20477c] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#183660]"
                            />
                            <p className="mt-1 text-xs text-gray-500">Format: JPG, PNG, WEBP. Maksimal 2MB</p>
                            {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                        </div>

                        {/* Is Active */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#20477c] focus:ring-[#20477c]"
                            />
                            <label htmlFor="is_active" className="text-sm text-gray-700">
                                Produk Aktif
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.visit('/dashboard/owner/products')}
                                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-md bg-[#20477c] px-4 py-2 text-white transition-colors hover:bg-[#183660] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Update Produk'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </OwnerLayout>
    );
}
