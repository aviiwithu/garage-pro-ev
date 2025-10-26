
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Technician } from '@/lib/technician-data';
import { Customer } from '@/lib/customer-data';
import { collection, onSnapshot, query, where, getDocs, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPasswordByAdmin } from '@/lib/firebase-admin';

// An Employee can be a Technician or a User with the 'admin' or 'customer' role.
export type Employee = Technician | (Customer & { role: 'admin' | 'customer' });

interface EmployeeContextType {
  employees: Employee[];
  technicians: Technician[];
  addTechnician: (technicianData: Omit<Technician, 'id' | 'role'>, password: string) => Promise<void>;
  updateTechnician: (id: string, technician: Partial<Technician>) => Promise<void>;
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

  const addTechnician = async (technicianData: Omit<Technician, 'id' | 'role'>, password: string) => {
    if (!technicianData.email || !password) {
      throw new Error("Email and password are required to create a new technician.");
    }

    try {
      const { data: user, message } = await createUserWithEmailAndPasswordByAdmin({ email: technicianData.email, password, displayName: technicianData.name ?? technicianData.displayName ?? '' })
      if (!user) {
        throw new Error(message)
      }
      // 2. Prepare the data for Firestore, adding the 'technician' role
      const dataToSave: Omit<Technician, 'id'> = {
        ...technicianData,
        role: 'technician',
      };

      // 3. Save the technician data to the 'users' collection in Firestore
      //    using the generated auth user's UID as the document ID.
      await setDoc(doc(db, 'users', user.uid), dataToSave);

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.error("EmployeeContext: Error adding technician: Email already in use.");
        throw new Error("This email is already registered.");
      }
      console.error("EmployeeContext: Error adding technician:", error);
      throw error; // Re-throw for the form to handle
    }
  };


  const updateTechnician = async (id: string, technicianData: Partial<Technician>) => {
    try {
      const techDocRef = doc(db, 'users', id);
      await updateDoc(techDocRef, technicianData);
    } catch (error) {
      console.error("EmployeeContext: Error updating technician:", error);
      throw error;
    }
  };

  const batchAddEmployees = async (employeesToAdd: (Omit<Employee, 'id'>)[]) => {
    try {
      const batch = writeBatch(db);
      const usersRef = collection(db, 'users');

      for (const emp of employeesToAdd) {
        // Safety Check: Prevent creating auth-required users without an auth record.
        if (emp.role === 'admin' || emp.role === 'technician') {
          throw new Error(`Batch adding is not supported for roles that require authentication. Offending email: ${emp.email}`);
        }

        const newDocRef = doc(usersRef);
        const newEmployeeData = {
          ...emp,
        };
        batch.set(newDocRef, newEmployeeData);
      }

      await batch.commit();
    } catch (error) {
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
