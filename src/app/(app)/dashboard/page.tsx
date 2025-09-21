

'use client';

import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { TechnicianDashboard } from '@/components/dashboard/technician-dashboard';

export default function DashboardPage() {
    const { viewAsRole, role, loading } = useAuth();
    
    const effectiveRole = viewAsRole || role;

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (effectiveRole === 'technician') {
        return <TechnicianDashboard />;
    }

    return <AdminDashboard />;
}
