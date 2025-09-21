
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Customer } from '@/lib/customer-data';
import type { Technician } from '@/lib/technician-data';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    User as FirebaseAuthUser, 
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type User = (Customer | Technician) & { role: UserRole; firebaseUid?: string };
export type UserRole = 'admin' | 'customer' | 'technician' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole | null;
  viewAsRole: UserRole | null;
  setViewAsRole: (role: UserRole | null) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS = {
    'customer@garagepro.com': {
        id: 'mock-customer-1',
        name: 'John Customer',
        displayName: 'John C.',
        email: 'customer@garagepro.com',
        role: 'customer',
        type: 'B2C',
        mobile: '1112223333',
        address: '123 Customer Way',
        vehicles: ['CUST-123'],
        portalStatus: 'Enabled'
    },
    'tech@garagepro.com': {
        id: 'mock-tech-1',
        name: 'Jane Technician',
        displayName: 'Jane T.',
        email: 'tech@garagepro.com',
        role: 'technician',
        specialization: 'Electrical',
        designation: 'Senior Technician',
        phone: '4445556666'
    }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);
  const router = useRouter();
  
  const isAuthenticated = !!user;
  const role = viewAsRole || user?.role || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Corrected Logic: Check for admin user FIRST.
        if (firebaseUser.email === 'admin@garagepro.com') {
             setUser({
                id: 'admin-user',
                firebaseUid: firebaseUser.uid,
                name: 'Admin User',
                displayName: 'Admin User',
                email: 'admin@garagepro.com',
                role: 'admin',
                type: 'B2B',
                mobile: '0000000000',
                address: 'GaragePRO HQ',
                vehicles: [],
                portalStatus: 'Enabled',
            } as User);
            setLoading(false);
            return;
        }

        // Check for mock users for testing
        if (firebaseUser.email && MOCK_USERS[firebaseUser.email as keyof typeof MOCK_USERS]) {
            setUser({
                ...MOCK_USERS[firebaseUser.email as keyof typeof MOCK_USERS],
                firebaseUid: firebaseUser.uid,
            } as User);
            setLoading(false);
            return;
        }
        
        // Proceed with Firestore check for regular users
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, id: userDoc.id, firebaseUid: firebaseUser.uid });
        } else {
             // Fallback for customer portal users who might not have a UID-based doc yet
            const customerDocRef = doc(db, "users", firebaseUser.email!.replace(/[^a-zA-Z0-9]/g, ''));
            const customerDoc = await getDoc(customerDocRef);
            if (customerDoc.exists()) {
                const customerData = customerDoc.data() as User;
                 setUser({ ...customerData, id: customerDoc.id, firebaseUid: firebaseUser.uid });
            } else {
                console.error("No user profile found in Firestore for UID:", firebaseUser.uid);
                await signOut(auth);
                setUser(null);
            }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    // Development override for admin user
    if (email === 'admin@garagepro.com' && pass === 'password123') {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            // If the admin user does not exist, this will fail. We can ignore it
            // because we will set the user manually for the demo.
            console.log("Admin user not found in Firebase Auth, proceeding with mock login.");
            setUser({
                id: 'admin-user',
                firebaseUid: 'admin-uid-placeholder',
                name: 'Admin User',
                displayName: 'Admin User',
                email: 'admin@garagepro.com',
                role: 'admin',
                type: 'B2B',
                mobile: '0000000000',
                address: 'GaragePRO HQ',
                vehicles: [],
                portalStatus: 'Enabled',
            } as User);
        }
        return;
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setViewAsRole(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated,
        user,
        role,
        viewAsRole,
        setViewAsRole,
        login, 
        logout, 
        loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
