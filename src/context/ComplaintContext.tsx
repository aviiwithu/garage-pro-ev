
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Complaint, ComplaintStatus } from '@/lib/complaint-data';
import { InventoryPart, ServiceItem } from '@/lib/inventory-data';
import { Invoice } from '@/lib/invoice-data';
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, addDoc, arrayUnion,or, arrayRemove, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db, storage } from '@/lib/firebase';
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import { Technician } from '@/lib/technician-data';

interface ComplaintContextType {
  complaints: Complaint[];
  invoices: Invoice[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt' | 'assignedTo' | 'statusHistory' | 'estimatedItems' | 'actualItems'>, attachments: FileList | null) => Promise<void>;
  updateComplaintStatus: (id: string, status: ComplaintStatus) => Promise<void>;
  assignTechnician: (complaintId: string, technician: Technician) => Promise<void>;
  addEstimatedItem: (complaintId: string, item: InventoryPart | ServiceItem, type: 'part' | 'service') => Promise<void>;
  addActualItem: (complaintId: string, item: InventoryPart | ServiceItem, type: 'part' | 'service') => Promise<void>;
  removeEstimatedItem: (complaintId: string, item: InventoryPart | ServiceItem, type: 'part' | 'service') => Promise<void>;
  removeActualItem: (complaintId: string, item: InventoryPart | ServiceItem, type: 'part' | 'service') => Promise<void>;
  approveEstimate: (complaintId: string) => Promise<void>;
  closeAndInvoiceComplaint: (complaintId: string) => Promise<void>;
  loading: boolean;
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

export const ComplaintProvider = ({ children }: { children: ReactNode }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUserName = user?.name;
    const currentUserId = user?.id;
    if (authLoading || !role || (role === 'customer' && !currentUserId)) {
      setLoading(false);
      return () => {};
    };

    let unsubscribeComplaints = () => {};
    let unsubscribeInvoices = () => {};

    setLoading(true);
    
    let complaintQuery;
    if (role === 'admin') {
      complaintQuery = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    } else if (role === 'customer') {
       complaintQuery = query(collection(db, 'complaints'), or(where('contactNumber', '==', user?.phone),where('createdBy', '==', user?.id)), orderBy('createdAt', 'desc'));
     } else if(role === 'technician'){
       complaintQuery = query(collection(db, 'complaints'), where('assignedTechnicianId', '==', user?.id), orderBy('createdAt', 'desc'));
      } else {
      setLoading(false);
      setComplaints([]);
      setInvoices([]);
      return;
    }

    unsubscribeComplaints = onSnapshot(complaintQuery, (snapshot) => {
      const complaintList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
      setComplaints(complaintList);
      setLoading(false);
    }, (error) => {
      console.error("ComplaintContext: Error fetching complaints:", error);
      setLoading(false);
    });

    if (role === 'admin' || role === 'customer') {
      const invoiceQuery = query(collection(db, 'invoices'), orderBy('date', 'desc'));
      unsubscribeInvoices = onSnapshot(invoiceQuery, (snapshot) => {
        const invoiceList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
         if (role === 'customer' && currentUserName) {
            setInvoices(invoiceList.filter(inv => inv.customerName === currentUserName));
        } else {
            setInvoices(invoiceList);
        }
      }, (error) => {
        console.error("ComplaintContext: Error fetching invoices:", error);
      });
    }

    return () => {
      unsubscribeComplaints();
      unsubscribeInvoices();
    };
  }, [user?.id, user?.name, role, authLoading]);


  const addComplaint = async (complaintData: any, attachments: FileList | null) => {
    try {
        const { detailedIssue, ...restOfData } = complaintData;
        const newComplaintData = {
            ...restOfData,
            issue: complaintData.issue, // This is now the main title
            detailedIssue: detailedIssue, // The detailed description
            vehicleNumber: complaintData.registrationNumber, // Ensure this mapping is correct
            status: 'Open' as ComplaintStatus,
            createdAt: new Date().toISOString(),
            assignedTo: 'Unassigned',
            statusHistory: [{ status: 'Open' as ComplaintStatus, timestamp: new Date().toISOString() }],
            estimatedItems: { parts: [], services: [] },
            actualItems: { parts: [], services: [] },
            attachmentUrls: [],
            createdBy:user?.id,
            creatorRole:user?.role,
            assignedTechnicianId:null
        };
        
        const docRef = await addDoc(collection(db, 'complaints'), newComplaintData);

        if (attachments && attachments.length > 0) {
            const attachmentUrls = await Promise.all(
                Array.from(attachments).map(async (file) => {
                    const storageRef = ref(storage, `complaints/${docRef.id}/${file.name}`);
                    await uploadBytes(storageRef, file);
                    return await getDownloadURL(storageRef);
                })
            );
            
            await updateDoc(docRef, { attachmentUrls });
        }
    } catch(error) {
        console.error("ComplaintContext: Error adding complaint:", error);
        throw error;
    }
  };

  const updateComplaintStatus = async (complaintId: string, status: ComplaintStatus) => {
    const complaintRef = doc(db, 'complaints', complaintId);
    const statusUpdate = {
        status: status,
        timestamp: new Date().toISOString(),
    };
    
    const updates: Record<string, any> = {
        status: status,
        statusHistory: arrayUnion(statusUpdate),
    };

    if (status === 'Resolved') {
        updates.resolvedAt = new Date().toISOString();
    }
    
    await updateDoc(complaintRef, updates);
  }

  const assignTechnician = async (complaintId: string, technician: Technician) => {
      const complaintRef = doc(db, 'complaints', complaintId);
      const statusUpdate = {
          status: 'Technician Assigned',
          timestamp: new Date().toISOString(),
      };
      await updateDoc(complaintRef, {
          status: 'Technician Assigned',
          assignedTo: technician.name,
          assignedTechnicianId:technician.id,
          statusHistory: arrayUnion(statusUpdate),
      });
  }

  const addEstimatedItem = async (complaintId: string, item: InventoryPart | ServiceItem, type: 'part' | 'service') => {
      const complaintRef = doc(db, 'complaints', complaintId);
      const field = type === 'part' ? 'estimatedItems.parts' : 'estimatedItems.services';
      await updateDoc(complaintRef, {
          [field]: arrayUnion(item),
      });
  }

  const removeEstimatedItem = async (complaintId: string, item: InventoryPart | ServiceItem, type: 'part' | 'service') => {
      const complaintRef = doc(db, 'complaints', complaintId);
      const field = type === 'part' ? 'estimatedItems.parts' : 'estimatedItems.services';
      await updateDoc(complaintRef, {
          [field]: arrayRemove(item),
      });
  }
  
  const addActualItem = async (complaintId: string, item: InventoryPart | ServiceItem, type: 'part' | 'service') => {
      const complaintRef = doc(db, 'complaints', complaintId);
      const field = type === 'part' ? 'actualItems.parts' : 'actualItems.services';
      await updateDoc(complaintRef, {
          [field]: arrayUnion(item),
      });
  }

  const removeActualItem = async (complaintId: string, item: InventoryPart | ServiceItem, type: 'part' | 'service') => {
      const complaintRef = doc(db, 'complaints', complaintId);
      const field = type === 'part' ? 'actualItems.parts' : 'actualItems.services';
      await updateDoc(complaintRef, {
          [field]: arrayRemove(item),
      });
  }

  const approveEstimate = async (complaintId: string) => {
      const complaintRef = doc(db, 'complaints', complaintId);
      const statusUpdate = {
          status: 'Estimate Approved',
          timestamp: new Date().toISOString(),
      };
      await updateDoc(complaintRef, {
          status: 'Estimate Approved',
          statusHistory: arrayUnion(statusUpdate),
      });
  }
  
    const closeAndInvoiceComplaint = async (complaintId: string) => {
        const complaint = complaints.find(c => c.id === complaintId);
        if (!complaint) {
            console.error("ComplaintContext: Complaint not found for invoicing.");
            return;
        }
        
        try {
            const batch = writeBatch(db);

            const complaintRef = doc(db, 'complaints', complaint.id);
            batch.update(complaintRef, { status: 'Closed' });

            // Create Invoice from Actual Items
            const items = complaint.actualItems;
            const subtotal = (items?.parts?.reduce((sum, part) => sum + part.price, 0) || 0) + (items?.services?.reduce((sum, service) => sum + service.price, 0) || 0);
            const totalTax = (items?.parts?.reduce((sum, part) => sum + (part.price * (part.gstRate || 0) / 100), 0) || 0) + (items?.services?.reduce((sum, service) => sum + (service.price * (service.gstRate || 0) / 100), 0) || 0);
            const grandTotal = subtotal + totalTax;

            const invoiceRef = doc(collection(db, 'invoices'));
            const newInvoice = {
                ticketId: complaint.id,
                customerName: complaint.customerName,
                vehicleNumber: complaint.vehicleNumber,
                date: new Date().toISOString(),
                services: items.services || [],
                parts: items.parts || [],
                total: grandTotal,
                status: 'Unpaid' as 'Unpaid' | 'Paid',
            };
            batch.set(invoiceRef, newInvoice);

            // Create Transaction Log
            const transactionRef = doc(collection(db, 'transactions'));
            const newTransaction = {
                date: new Date().toISOString(),
                type: 'Invoice Created',
                description: `Invoice for Ticket #${complaint.id.substring(0, 6)} - ${complaint.vehicleNumber}`,
                amount: grandTotal,
                relatedInvoiceId: invoiceRef.id,
                relatedTicketId: complaint.id,
            };
            batch.set(transactionRef, newTransaction);
            
            // Deduct stock from inventory
            if(complaint.actualItems.parts.length > 0){
                complaint.actualItems.parts.forEach(partUsed => {
                    if(partUsed.id) {
                        const partRef = doc(db, "inventoryParts", partUsed.id);
                        const newStock = (partUsed.stock || 0) - 1; // Assuming quantity is always 1
                        batch.update(partRef, { stock: newStock });
                    }
                });
            }

            await batch.commit();
        } catch(error) {
            console.error("ComplaintContext: Error closing and invoicing complaint:", error);
            throw error;
        }
    };


  return (
    <ComplaintContext.Provider value={{ 
        complaints, 
        invoices,
        addComplaint, 
        updateComplaintStatus,
        assignTechnician,
        addEstimatedItem,
        addActualItem,
        removeEstimatedItem,
        removeActualItem,
        approveEstimate,
        closeAndInvoiceComplaint,
        loading
    }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaint = () => {
  const context = useContext(ComplaintContext);
  if (context === undefined) {
    throw new Error('useComplaint must be used within a ComplaintProvider');
  }
  return context;
};
