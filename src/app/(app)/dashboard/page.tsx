

'use client';

import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { TechnicianDashboard } from '@/components/dashboard/technician-dashboard';

export default function DashboardPage() {
    const { role, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (role === 'technician') {
        return <TechnicianDashboard />;
    }

    return <AdminDashboard />;
}
