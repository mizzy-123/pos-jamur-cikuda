import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

interface Props {
    children: ReactNode;
}

export default function PosLayout({ children }: Props) {
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

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-[#20477c] shadow-lg">
                <div className="flex h-14 items-center justify-between px-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        {/* <span className="text-2xl">🍄</span> */}
                        <img className="size-14" src="/images/JamurCikudaNusantara.png" />
                        <span className="font-bold text-white">POS Jamur Cikuda</span>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-white/80">
                            {auth.user.name} ({auth.user.role})
                        </span>
                        {auth.user.role === 'owner' && (
                            <a
                                href="/dashboard/owner"
                                className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
                            >
                                Dashboard
                            </a>
                        )}
                        <button
                            onClick={handleLogout}
                            className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}
