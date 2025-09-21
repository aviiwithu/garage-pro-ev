
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Vendor, VendorPerformance, VendorContract } from '@/lib/vendor-data';
import { collection, onSnapshot, addDoc, doc, updateDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';

interface VendorContextType {
  vendors: Vendor[];
  performanceRecords: VendorPerformance[];
  contracts: VendorContract[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => Promise<void>;
  updateVendorStatus: (id: string, status: Vendor['status']) => Promise<void>;
  loading: boolean;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const { role, loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<VendorPerformance[]>([]);
  const [contracts, setContracts] = useState<VendorContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !role) {
      setLoading(false);
      return;
    }

    if (role !== 'admin') {
      setVendors([]);
      setPerformanceRecords([]);
      setContracts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const vendorsQuery = query(collection(db, 'vendors'), orderBy('createdAt', 'desc'));
    const performanceQuery = query(collection(db, 'vendorPerformance'), orderBy('period', 'desc'));
    const contractsQuery = query(collection(db, 'vendorContracts'), orderBy('endDate', 'desc'));

    const unsubscribeVendors = onSnapshot(vendorsQuery, (snapshot) => {
      const vendorList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
      setVendors(vendorList);
      setLoading(false);
    }, (error) => {
      console.error("VendorContext: Error fetching vendors:", error);
      setLoading(false);
    });
    
    const unsubscribePerformance = onSnapshot(performanceQuery, (snapshot) => {
      const perfList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorPerformance));
      setPerformanceRecords(perfList);
    }, (error) => {
        console.error("VendorContext: Error fetching performance records:", error);
    });

    const unsubscribeContracts = onSnapshot(contractsQuery, (snapshot) => {
        const contractList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorContract));
        setContracts(contractList);
    }, (error) => {
        console.error("VendorContext: Error fetching contracts:", error);
    });

    return () => {
        unsubscribeVendors();
        unsubscribePerformance();
        unsubscribeContracts();
    };
  }, [role, authLoading]);

  const addVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt'>) => {
    try {
        const newVendor = {
            ...vendorData,
            createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'vendors'), newVendor);
    } catch(error) {
        console.error("VendorContext: Error adding vendor:", error);
        throw error;
    }
  };

  const updateVendorStatus = async (id: string, status: Vendor['status']) => {
    try {
        const vendorRef = doc(db, 'vendors', id);
        await updateDoc(vendorRef, { status });
    } catch(error) {
        console.error("VendorContext: Error updating vendor status:", error);
        throw error;
    }
  };

  return (
    <VendorContext.Provider value={{ vendors, performanceRecords, contracts, addVendor, updateVendorStatus, loading }}>
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};
