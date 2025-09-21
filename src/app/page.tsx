
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { role, loading: authLoading, isAuthenticated, viewAsRole } = useAuth();

  useEffect(() => {
    // Only perform redirects if the authentication status is fully loaded
    if (!authLoading) {
      if (!isAuthenticated) {
        // If not authenticated, always send to login
        router.replace('/login');
        return;
      }
      
      // If authenticated, wait until the role is determined before redirecting
      if (role) {
          const effectiveRole = viewAsRole || role;

          switch (effectiveRole) {
            case "admin":
              router.replace("/dashboard");
              break;
            case "technician":
              router.replace("/human-resources/attendance");
              break;
            case "customer":
              router.replace("/customers/dashboard");
              break;
            default:
              // Fallback if role is somehow invalid
              router.replace("/login");
              break;
          }
      }
      // If auth is loaded, user is authenticated, but role is still null,
      // this component will just continue showing the loading spinner,
      // preventing any premature redirects.
    }
  }, [role, authLoading, isAuthenticated, router, viewAsRole]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="ml-2">Loading Application...</p>
    </div>
  );
}
