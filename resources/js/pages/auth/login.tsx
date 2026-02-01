import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        if (errors.email) {
            toast.error(errors.email);
        }
        if (errors.password) {
            toast.error(errors.password);
        }
    }, [errors]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('Sedang memproses login...');

        post('/login', {
            preserveScroll: false,
            preserveState: false,
            onError: () => {
                toast.dismiss(toastId);
                toast.error('Login gagal. Periksa kembali email dan password Anda.');
            },
            onFinish: () => {
                // We don't dismiss here immediately because if it's success,
                // the page will redirect. If we dismiss, it might flicker.
                // But for error, onError handles it.
            },
        });
    };

    return (
        <>
            <Head title="Login" />
            <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
                <div className="w-full max-w-md">
                    {/* Logo & Title */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#20477c]">
                            {/* <span className="text-2xl">🍄</span> */}
                            <img src="/images/JamurCikudaNusantara.png" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">POS Jamur Cikuda Nusantara</h1>
                        <p className="mt-2 text-gray-600">Masuk ke akun Anda</p>
                    </div>

                    {/* Login Form */}
                    <div className="rounded-lg bg-white p-8 shadow-md">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                        errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#20477c]'
                                    }`}
                                    placeholder="email@example.com"
                                    autoComplete="email"
                                    autoFocus
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={`block w-full rounded-md border px-3 py-2 pr-10 shadow-sm focus:ring-2 focus:ring-[#20477c] focus:outline-none ${
                                            errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#20477c]'
                                        }`}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#20477c] focus:ring-[#20477c]"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                                    Ingat saya
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-md bg-[#20477c] px-4 py-2 text-white transition-colors hover:bg-[#183660] focus:ring-2 focus:ring-[#20477c] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Masuk...' : 'Masuk'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
