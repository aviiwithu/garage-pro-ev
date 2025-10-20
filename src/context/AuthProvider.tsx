
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
  signInWithPopup,
  linkWithCredential
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { verifyRecaptcha } from '@/app/actions/auth';
import { useToast } from '@/hooks/use-toast';

export type User = Customer | Technician;
export type UserRole = 'admin' | 'customer' | 'technician' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole | null;
  login: (email: string, pass: string, token: string) => Promise<void>;
  signInWithGoogle: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Customer | Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();


  const isAuthenticated = !!user;
  const role = user?.role || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {

        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          if (role!=="admin" && userData?.portalStatus && userData?.portalStatus === "Disabled") {
            toast({
              title: 'Login Failed',
              description: "Your portal access has been disabled. Please contact support.",
              variant: 'destructive',
            });
            setLoading(false);
            await signOut(auth);
            setUser(null);
          } else {
            setUser({ ...userData, id: userDoc.id });
          }
        } else {
          const isGoogleSignIn = firebaseUser.providerData.some(
            (provider) => provider.providerId === 'google.com'
          );

          const customerDoc = await findUserByEmail(firebaseUser.email!);


          if (isGoogleSignIn) {

            // const credential = GoogleAuthProvider.credential(
            //   (firebaseUser as any).stsTokenManager.accessToken,
            //   (firebaseUser as any).stsTokenManager.refreshToken
            // );

            // await linkWithCredential(firebaseUser, credential);

            if (!customerDoc?.exists()) {
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

            }
          } else if (firebaseUser.email) {
            // const customerDocRef = doc(db, "users", firebaseUser.email.replace(/[^a-zA-Z0-9]/g, ''));
            // const customerDoc = await getDoc(customerDocRef);
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
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async (token: string) => {

    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const findUserByEmail = async (email: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs[0]
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      role,
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
