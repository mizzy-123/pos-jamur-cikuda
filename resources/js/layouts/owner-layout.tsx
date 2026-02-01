import { SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

interface Props {
    children: ReactNode;
    title?: string;
}

export default function OwnerLayout({ children, title }: Props) {
    const { auth, flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleLogout = () => {
        router.post('/logout');
    };

    const navItems = [
        { name: 'Dashboard', href: '/dashboard/owner', icon: '📊' },
        { name: 'Produk', href: '/dashboard/owner/products', icon: '📦' },
        { name: 'Kategori', href: '/dashboard/owner/categories', icon: '🏷️' },
        { name: 'Pesanan', href: '/dashboard/owner/orders', icon: '📋' },
        { name: 'POS', href: '/dashboard/pos', icon: '🛒' },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation */}
            <nav className="bg-[#20477c] shadow-lg">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            {/* <span className="text-2xl">🍄</span> */}
                            <img className="size-14" src="/images/JamurCikudaNusantara.png" />
                            <span className="text-lg font-bold text-white">POS Jamur Cikuda</span>
                        </div>

                        {/* Nav Items */}
                        <div className="hidden md:flex md:items-center md:gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        window.location.pathname === item.href || window.location.pathname.startsWith(item.href + '/')
                                            ? 'bg-white/20 text-white'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-white/80">{auth.user.name}</span>
                            <button
                                onClick={handleLogout}
                                className="rounded-md bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/20"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className="border-t border-white/10 md:hidden">
                    <div className="flex overflow-x-auto px-2 py-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium ${
                                    window.location.pathname === item.href ? 'bg-white/20 text-white' : 'text-white/80'
                                }`}
                            >
                                <span>{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Page Header */}
            {title && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </div>
    );
}
