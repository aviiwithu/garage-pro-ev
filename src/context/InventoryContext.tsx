
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { InventoryPart, ServiceItem } from '@/lib/inventory-data';
import { collection, onSnapshot, addDoc, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';
import { StockAdjustment } from '@/lib/inventory-data';


interface InventoryContextType {
  parts: InventoryPart[];
  services: ServiceItem[];
  batchAddOrUpdateParts: (partsToAdd: Omit<InventoryPart, 'id'>[], partsToUpdate: InventoryPart[]) => Promise<void>;
  batchAddOrUpdateServices: (partsToAdd: Omit<ServiceItem, 'id'>[], partsToUpdate: ServiceItem[]) => Promise<void>;
  addService: (service: Omit<ServiceItem, 'id'>) => Promise<void>;
  adjustStock: (partId: string, newQuantity: number, reason: string,adjustmentMode: 'set' | 'add' | 'remove') => Promise<void>;
  findPartBySKU: (sku: string) => InventoryPart | undefined;
  loading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !role) {
      setLoading(false);
      return;
    }

    if (role !== 'admin' && role !== 'technician') {
      setParts([]);
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const partsCol = collection(db, 'inventoryParts');
    const servicesCol = collection(db, 'inventoryServices');

    const unsubscribeParts = onSnapshot(partsCol, (snapshot) => {
      const partList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryPart));
      setParts(partList);
      setLoading(false);
    }, (error) => {
      console.error("InventoryContext: Error fetching parts: ", error);
      setLoading(false);
    });

    const unsubscribeServices = onSnapshot(servicesCol, (snapshot) => {
      const serviceList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem));
      setServices(serviceList);
    }, (error) => {
      console.error("InventoryContext: Error fetching services: ", error);
    });

    return () => {
      unsubscribeParts();
      unsubscribeServices();
    };
  }, [role, authLoading]);

  const batchAddOrUpdateParts = async (partsToAdd: Omit<InventoryPart, 'id'>[], partsToUpdate: InventoryPart[]) => {
    try {
      const allOperations = [
        ...partsToAdd.map(part => ({ type: 'add' as const, data: part })),
        ...partsToUpdate.map(part => ({ type: 'update' as const, data: part }))
      ];

      for (let i = 0; i < allOperations.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = allOperations.slice(i, i + 500);

        chunk.forEach(op => {
          if (op.type === 'add') {
            const newDocRef = doc(collection(db, 'inventoryParts'));
            batch.set(newDocRef, op.data);
          } else if (op.type === 'update') {
            const updateDocRef = doc(db, 'inventoryParts', (op.data as InventoryPart).id!);
            batch.update(updateDocRef, op.data);
          }
        });
        await batch.commit();
      }
    } catch (error) {
      console.error("InventoryContext: Error batch adding/updating parts:", error);
      throw error;
    }
  };

  const batchAddOrUpdateServices = async (partsToAdd: Omit<ServiceItem, 'id'>[], partsToUpdate: ServiceItem[]) => {
    try {
      const allOperations = [
        ...partsToAdd.map(part => ({ type: 'add' as const, data: part })),
        ...partsToUpdate.map(part => ({ type: 'update' as const, data: part }))
      ];

      for (let i = 0; i < allOperations.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = allOperations.slice(i, i + 500);

        chunk.forEach(op => {
          if (op.type === 'add') {
            const newDocRef = doc(collection(db, 'inventoryServices'));
            batch.set(newDocRef, op.data);
          } else if (op.type === 'update') {
            const updateDocRef = doc(db, 'inventoryServices', (op.data as ServiceItem).id!);
            batch.update(updateDocRef, op.data);
          }
        });
        await batch.commit();
      }
    } catch (error) {
      console.error("InventoryContext: Error batch adding/updating parts:", error);
      throw error;
    }
  };


  const addService = async (serviceData: Omit<ServiceItem, 'id'>) => {
    try {
      await addDoc(collection(db, 'inventoryServices'), serviceData);
    } catch (error) {
      console.error("InventoryContext: Error adding service:", error);
      throw error;
    }
  };

  const adjustStock = async (partId: string, newQuantity: number, reason: string,adjustmentMode: 'set' | 'add' | 'remove') => {
    if (!user) throw new Error("User not authenticated.");

    const partRef = doc(db, 'inventoryParts', partId);
    const part = parts.find(p => p.id === partId);
    if (!part) throw new Error("Part not found.");

    const adjustmentLog: Omit<StockAdjustment, 'id'> = {
      partId,
      partName: part.name,
      partNumber: part.partNumber,
      adjustedBy: user.name || user.email!,
      adjustedByUserId:user.id,
      adjustmentMode,
      adjustmentType: newQuantity > part.stock ? 'IN' : 'OUT',
      quantityChange: Math.abs(newQuantity - part.stock),
      oldQuantity: part.stock,
      newQuantity: newQuantity,
      reason,
      timestamp: new Date().toISOString(),
    };

    const batch = writeBatch(db);
    batch.update(partRef, { stock: newQuantity });

    const logRef = doc(collection(db, 'stockAdjustments'));
    batch.set(logRef, adjustmentLog);

    await batch.commit();
  };

  const findPartBySKU = (sku: string): InventoryPart | undefined => {
    return parts.find(p => p.partNumber === sku);
  }

  return (
    <InventoryContext.Provider value={{ parts, services, batchAddOrUpdateParts, addService, batchAddOrUpdateServices, findPartBySKU, adjustStock, loading }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
