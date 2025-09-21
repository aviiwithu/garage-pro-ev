
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Quote, SalesOrder, QuoteStatus } from '@/lib/sales-data';
import { collection, onSnapshot, addDoc, doc, updateDoc, writeBatch, query, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';

interface SalesContextType {
  quotes: Quote[];
  salesOrders: SalesOrder[];
  addQuote: (quoteData: Omit<Quote, 'id' | 'createdAt' | 'status' | 'subTotal' | 'totalTax' | 'total'>) => Promise<void>;
  updateQuoteStatus: (id: string, status: QuoteStatus) => Promise<void>;
  convertToSalesOrder: (quoteId: string) => Promise<void>;
  loading: boolean;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider = ({ children }: { children: ReactNode }) => {
  const { role, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !role) {
      setLoading(false);
      return;
    }

    if (role !== 'admin') {
      setQuotes([]);
      setSalesOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const quotesQuery = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const soQuery = query(collection(db, 'salesOrders'), orderBy('createdAt', 'desc'));

    const unsubscribeQuotes = onSnapshot(quotesQuery, (snapshot) => {
      const quotesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
      setQuotes(quotesList);
      setLoading(false);
    }, (error) => {
        console.error("SalesContext: Error fetching quotes:", error);
        setLoading(false);
    });

    const unsubscribeSO = onSnapshot(soQuery, (snapshot) => {
      const soList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesOrder));
      setSalesOrders(soList);
    }, (error) => {
        console.error("SalesContext: Error fetching sales orders:", error);
    });

    return () => {
      unsubscribeQuotes();
      unsubscribeSO();
    };
  }, [role, authLoading]);

  const addQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt' | 'status' | 'subTotal' | 'totalTax' | 'total'>) => {
    try {
        const totals = quoteData.items.reduce((acc, item) => {
            const itemTotal = (item.quantity || 0) * (item.rate || 0);
            const discountAmount = itemTotal * ((item.discount || 0) / 100);
            const taxableAmount = itemTotal - discountAmount;
            const taxAmount = taxableAmount * ((item.tax || 0) / 100);
            acc.subTotal += taxableAmount;
            acc.totalTax += taxAmount;
            return acc;
        }, { subTotal: 0, totalTax: 0 });

        const grandTotal = totals.subTotal + totals.totalTax + (quoteData.adjustment || 0);
        
        const newQuote: Omit<Quote, 'id'> = {
            ...quoteData,
            quoteDate: new Date(quoteData.quoteDate).toISOString(),
            expiryDate: quoteData.expiryDate ? new Date(quoteData.expiryDate).toISOString() : undefined,
            status: 'Draft',
            subTotal: totals.subTotal,
            totalTax: totals.totalTax,
            total: grandTotal,
            createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'quotes'), newQuote);
    } catch(error) {
        console.error("SalesContext: Error adding quote:", error);
        throw error;
    }
  };
  
  const updateQuoteStatus = async (id: string, status: QuoteStatus) => {
    try {
        const quoteRef = doc(db, 'quotes', id);
        await updateDoc(quoteRef, { status });
    } catch(error) {
        console.error("SalesContext: Error updating quote status:", error);
        throw error;
    }
  };

  const convertToSalesOrder = async (quoteId: string) => {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote || quote.status !== 'Accepted') return;
      try {
        const batch = writeBatch(db);

        const quoteRef = doc(db, 'quotes', quoteId);
        batch.update(quoteRef, { status: 'Converted' });

        const soRef = doc(collection(db, 'salesOrders'));
        const newSO: Omit<SalesOrder, 'id'> = {
            quoteId,
            customerId: quote.customerId,
            customerName: quote.customerName,
            salesOrderNumber: `SO-${quote.quoteNumber.split('-')[1]}`,
            orderDate: new Date().toISOString(),
            items: quote.items,
            total: quote.total,
            status: 'Confirmed',
            createdAt: new Date().toISOString(),
        };
        batch.set(soRef, newSO);

        await batch.commit();
      } catch(error) {
        console.error("SalesContext: Error converting quote to SO:", error);
        throw error;
      }
  };

  return (
    <SalesContext.Provider value={{ quotes, salesOrders, addQuote, updateQuoteStatus, convertToSalesOrder, loading }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
