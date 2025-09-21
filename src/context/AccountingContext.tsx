
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Expense, Transaction } from '@/lib/accounting-data';
import { Invoice } from '@/lib/invoice-data';
import { collection, onSnapshot, addDoc, doc, writeBatch, query, orderBy, where, getDocs, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';

interface AccountingContextType {
  expenses: Expense[];
  transactions: Transaction[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  markInvoiceAsPaid: (invoice: Invoice) => Promise<void>;
  loading: boolean;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const AccountingProvider = ({ children }: { children: ReactNode }) => {
  const { role, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !role) {
      setLoading(false);
      return;
    }

    if (role !== 'admin') {
      setExpenses([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const expensesCol = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const transactionsCol = query(collection(db, 'transactions'), orderBy('date', 'desc'));

    const unsubscribeExpenses = onSnapshot(expensesCol, (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
        setLoading(false); 
    }, (error) => {
        console.error("AccountingContext: Error fetching expenses:", error);
        setLoading(false);
    });

    const unsubscribeTransactions = onSnapshot(transactionsCol, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => {
        console.error("AccountingContext: Error fetching transactions:", error);
    });

    return () => {
        unsubscribeExpenses();
        unsubscribeTransactions();
    };
  }, [role, authLoading]);

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
        const batch = writeBatch(db);
        
        const expenseRef = doc(collection(db, 'expenses'));
        batch.set(expenseRef, expenseData);

        const transactionRef = doc(collection(db, 'transactions'));
        const newTransaction: Omit<Transaction, 'id'> = {
            date: expenseData.date,
            type: 'Expense',
            description: `${expenseData.category}: ${expenseData.description}`,
            amount: -expenseData.amount,
        };
        batch.set(transactionRef, newTransaction);

        await batch.commit();
    } catch(error) {
        console.error("AccountingContext: Error adding expense:", error);
        throw error;
    }
  };
  
  const markInvoiceAsPaid = async (invoice: Invoice) => {
    try {
        const batch = writeBatch(db);

        const invoiceRef = doc(db, 'invoices', invoice.id);
        batch.update(invoiceRef, { status: 'Paid' });
        
        const complaintRef = doc(db, 'complaints', invoice.ticketId);
        batch.update(complaintRef, { status: 'Closed' });


        const originalTransactionQuery = query(
            collection(db, 'transactions'), 
            where('relatedInvoiceId', '==', invoice.id), 
            where('type', '==', 'Invoice Created')
        );
        
        const querySnapshot = await getDocs(originalTransactionQuery);
        if (!querySnapshot.empty) {
            const transactionDoc = querySnapshot.docs[0];
            batch.update(transactionDoc.ref, { 
                type: 'Revenue',
                date: new Date().toISOString(),
                description: `Payment for Invoice #${invoice.id.substring(0, 6)}`
            });
        } else {
            const transactionRef = doc(collection(db, 'transactions'));
            const newTransaction: Omit<Transaction, 'id'> = {
                date: new Date().toISOString(),
                type: 'Revenue',
                description: `Payment for Invoice #${invoice.id.substring(0, 6)} - ${invoice.vehicleNumber}`,
                amount: invoice.total,
                relatedInvoiceId: invoice.id,
                relatedTicketId: invoice.ticketId,
            };
            batch.set(transactionRef, newTransaction);
        }
        
        await batch.commit();
    } catch(error) {
        console.error("AccountingContext: Error marking invoice as paid:", error);
        throw error;
    }
  }

  return (
    <AccountingContext.Provider value={{ expenses, transactions, addExpense, markInvoiceAsPaid, loading }}>
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (context === undefined) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
