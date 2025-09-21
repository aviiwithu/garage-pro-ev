
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Technician } from '@/lib/technician-data';
import { Customer } from '@/lib/customer-data';
import { collection, onSnapshot, query, where, getDocs, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// An Employee can be a Technician or a User with the 'admin' or 'customer' role.
export type Employee = Technician | (Customer & { role: 'admin' | 'customer' });

interface EmployeeContextType {
  employees: Employee[];
  technicians: Technician[];
  addTechnician: (technician: Omit<Technician, 'id'> & { id: string }) => Promise<void>;
  updateTechnician: (id: string, technician: Partial<Omit<Technician, 'id'>>) => Promise<void>;
  batchAddEmployees: (employees: (Omit<Employee, 'id'>)[]) => Promise<void>;
  loading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const { role, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !role) {
      setLoading(false);
      return;
    }

    if (role !== 'admin') {
      setEmployees([]);
      setTechnicians([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersQuery = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        
        const employeeList = userList.filter(u => u.role === 'admin' || u.role === 'technician');
        const technicianList = userList.filter(u => u.role === 'technician') as Technician[];

        setEmployees(userList);
        setTechnicians(technicianList);
        
        setLoading(false);
    }, (error) => {
        console.error("EmployeeContext: Error fetching users:", error);
        setLoading(false);
    });

    return () => unsubscribe();

  }, [role, authLoading]);

  const addTechnician = async (technicianData: Omit<Technician, 'id'> & { id: string }) => {
    try {
        await setDoc(doc(db, 'users', technicianData.id), technicianData);
    } catch(error) {
        console.error("EmployeeContext: Error adding technician:", error);
        throw error;
    }
  };

  const updateTechnician = async (id: string, technicianData: Partial<Omit<Technician, 'id'>>) => {
    try {
        const techDocRef = doc(db, 'users', id);
        await updateDoc(techDocRef, technicianData);
    } catch(error) {
        console.error("EmployeeContext: Error updating technician:", error);
        throw error;
    }
  };
  
  const batchAddEmployees = async (employeesToAdd: (Omit<Employee, 'id'>)[]) => {
      try {
        const batch = writeBatch(db);
        const usersRef = collection(db, 'users');
        
        for (const emp of employeesToAdd) {
            const newDocRef = doc(usersRef);
            const newEmployeeData = {
                ...emp,
                id: newDocRef.id,
            };
            batch.set(newDocRef, newEmployeeData);
        }
        
        await batch.commit();
      } catch(error) {
        console.error("EmployeeContext: Error batch adding employees:", error);
        throw error;
      }
  };


  return (
    <EmployeeContext.Provider value={{ employees, technicians, addTechnician, updateTechnician, batchAddEmployees, loading }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};
