
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { role, loading: authLoading, isAuthenticated, viewAsRole } = useAuth();

  useEffect(() => {
    // Only perform redirects if authentication status is fully loaded and role is determined
    if (!authLoading && isAuthenticated && role) {
      const effectiveRole = viewAsRole || role;

      switch (effectiveRole) {
        case "admin":
          router.replace("/dashboard");
          break;
        case "technician":
          router.replace("/dashboard");
          break;
        case "customer":
          router.replace("/customers/dashboard");
          break;
        default:
          // Fallback for any invalid role state
          router.replace("/login");
          break;
      }
    } else if (!authLoading && !isAuthenticated) {
      // If not authenticated, redirect to login
      router.replace('/login');
    }
    // If authentication is still loading or the role is not yet determined,
    // this component will continue showing the loading spinner, preventing premature redirects.
  }, [role, authLoading, isAuthenticated, router, viewAsRole]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="ml-2">Loading Application...</p>
    </div>
  );
}
