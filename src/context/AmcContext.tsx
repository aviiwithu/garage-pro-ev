
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AMC } from '@/lib/amc-data';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';

interface AmcContextType {
  amcs: AMC[];
  addAmc: (amc: Omit<AMC, 'id'>) => Promise<void>;
  updateAmcStatus: (id: string, status: 'Active' | 'Expired' | 'Cancelled') => Promise<void>;
  loading: boolean;
}

const AmcContext = createContext<AmcContextType | undefined>(undefined);

export const AmcProvider = ({ children }: { children: ReactNode }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [amcs, setAmcs] = useState<AMC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUserId = user?.id;
    if (authLoading || !role || !currentUserId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const amcsQuery = role === 'admin' 
        ? collection(db, 'amcs') 
        : query(collection(db, 'amcs'), where('customerId', '==', currentUserId));
    
    const unsubscribe = onSnapshot(amcsQuery, (snapshot) => {
      const amcList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AMC));
      setAmcs(amcList);
      setLoading(false);
    }, (error) => {
        console.error("AmcContext: Error fetching AMCs: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, role, authLoading]);

  const addAmc = async (amcData: Omit<AMC, 'id'>) => {
    try {
        await addDoc(collection(db, 'amcs'), amcData);
    } catch(error) {
        console.error("AmcContext: Error adding AMC:", error);
        throw error;
    }
  };

  const updateAmcStatus = async (id: string, status: 'Active' | 'Expired' | 'Cancelled') => {
    try {
        const amcRef = doc(db, 'amcs', id);
        await updateDoc(amcRef, { status });
    } catch(error) {
        console.error("AmcContext: Error updating AMC status:", error);
        throw error;
    }
  };

  return (
    <AmcContext.Provider value={{ amcs, addAmc, updateAmcStatus, loading }}>
      {children}
    </AmcContext.Provider>
  );
};

export const useAmc = () => {
  const context = useContext(AmcContext);
  if (context === undefined) {
    throw new Error('useAmc must be used within an AmcProvider');
  }
  return context;
};
