'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="bg-green-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold">Probos</h1>
                        <div className="flex space-x-4">
                            <Link
                                href="/"
                                className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/' ? 'bg-green-800' : 'hover:bg-green-600'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/maintenance"
                                className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/maintenance' ? 'bg-green-800' : 'hover:bg-green-600'
                                    }`}
                            >
                                Maintenance
                            </Link>
                        </div>
                    </div>
                    <div className="text-sm opacity-90">Sensor Trust Verification Engine</div>
                </div>
            </div>
        </nav>
    );
}
