
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
    signOut,
    GoogleAuthProvider,
    signInWithRedirect,
    RecaptchaVerifier,
    getAuth,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { verifyRecaptcha } from '@/app/actions/auth';

export type User = Customer | Technician;
export type UserRole = 'admin' | 'customer' | 'technician' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole | null;
  viewAsRole: UserRole | null;
  setViewAsRole: (role: UserRole | null) => void;
  login: (email: string, pass: string, token: string) => Promise<void>;
  signInWithGoogle: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Customer|Technician| null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);
  const router = useRouter();
  
  const isAuthenticated = !!user;
  const role = viewAsRole || user?.role || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
       
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, id: userDoc.id});
        } else {
            const isGoogleSignIn = firebaseUser.providerData.some(
                (provider) => provider.providerId === 'google.com'
            );

            if (isGoogleSignIn) {
                const newUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'New Google User',
                    displayName: firebaseUser.displayName || 'Google User',
                    email: firebaseUser.email!,
                    role: 'customer',
                    type: 'B2C',
                    phone: firebaseUser.phoneNumber || '',
                    address: '',
                    vehicles: [],
                    portalStatus: 'Enabled'
                };
                await setDoc(userDocRef, newUser);
                setUser(newUser);
            } else if (firebaseUser.email) {
                const customerDocRef = doc(db, "users", firebaseUser.email.replace(/[^a-zA-Z0-9]/g, ''));
                const customerDoc = await getDoc(customerDocRef);
                if (customerDoc.exists()) {
                    const customerData = customerDoc.data() as User;
                     setUser({ ...customerData, id: customerDoc.id });
                } else {
                    console.error("No user profile found in Firestore for UID:", firebaseUser.uid);
                    await signOut(auth);
                    setUser(null);
                }
            } else {
                console.error("User authenticated without email, and no profile exists for UID:", firebaseUser.uid);
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



  const login = async (email: string, pass: string, token: string) => {

    // if (email === 'admin@garagepro.com' && pass === 'password123') {
    //     try {
    //         await signInWithEmailAndPassword(auth, email, pass);
    //     } catch (error: any) {
    //         console.log("Admin user not found in Firebase Auth, proceeding with mock login.");
    //         setUser({
    //             id: 'admin-user',
    //             firebaseUid: 'admin-uid-placeholder',
    //             name: 'Admin User',
    //             displayName: 'Admin User',
    //             email: 'admin@garagepro.com',
    //             role: 'admin',
    //             type: 'B2B',
    //             mobile: '0000000000',
    //             address: 'GaragePRO HQ',
    //             vehicles: [],
    //             portalStatus: 'Enabled',
    //         } as User);
    //     }
    //     return;
    // }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async (token: string) => {

    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setViewAsRole(null);
    router.push('/login');
  };
  
  console.log(user);
  return (
    <AuthContext.Provider value={{ 
        isAuthenticated,
        user,
        role,
        viewAsRole,
        setViewAsRole,
        login, 
        signInWithGoogle,
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
