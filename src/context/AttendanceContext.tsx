
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { db } from '@/lib/firebase';

export type AttendanceRecord = {
    id: string;
    technicianId: string;
    technicianName: string;
    clockInTime: string; // ISO String
    clockOutTime: string | null; // ISO String
    date: string; // YYYY-MM-DD
};


interface AttendanceContextType {
  records: AttendanceRecord[];
  todaysRecords: AttendanceRecord[];
  fetchRecordsForMonth: (month: Date) => void;
  clockIn: (technicianId: string, technicianName: string) => Promise<void>;
  clockOut: (recordId: string) => Promise<void>;
  loading: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const { role, user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todaysRecords, setTodaysRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchRecordsForMonth = useCallback((month: Date) => {
    setCurrentMonth(month);
  }, []);
  
  useEffect(() => {
    const currentUserId = user?.id;
    if (authLoading || !currentUserId || !role) {
        setLoading(false);
        return;
    };
    
    setLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    let recordsQuery;
    if (role === 'admin') {
      recordsQuery = query(collection(db, 'attendance'), where('date', '>=', startDate), where('date', '<=', endDate));
    } else {
      recordsQuery = query(collection(db, 'attendance'), where('date', '>=', startDate), where('date', '<=', endDate), where('technicianId', '==', currentUserId));
    }

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setRecords(fetchedRecords);
      setLoading(false);
    }, (error) => {
      console.error("AttendanceContext: Error fetching monthly attendance records:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, user?.id, currentMonth, authLoading]);

   useEffect(() => {
    const currentUserId = user?.id;
    if (authLoading || !currentUserId || !role) {
        setTodaysRecords([]);
        return;
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    let dailyQuery;
    if (role === 'admin') {
        dailyQuery = query(collection(db, 'attendance'), where('date', '==', todayStr));
    } else {
        dailyQuery = query(collection(db, 'attendance'), where('date', '==', todayStr), where('technicianId', '==', currentUserId));
    }

    const unsubscribe = onSnapshot(dailyQuery, (snapshot) => {
        const dailyRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
        setTodaysRecords(dailyRecords.sort((a,b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));
    }, (error) => {
        console.error("AttendanceContext: Error fetching today's attendance records:", error);
    });

    return () => unsubscribe();
  }, [role, user?.id, authLoading]);


  const clockIn = async (technicianId: string, technicianName: string) => {
    try {
        const newRecord: Omit<AttendanceRecord, 'id'> = {
            technicianId,
            technicianName,
            clockInTime: new Date().toISOString(),
            clockOutTime: null,
            date: format(new Date(), 'yyyy-MM-dd'),
        };
        await addDoc(collection(db, 'attendance'), newRecord);
    } catch(error) {
        console.error("AttendanceContext: Error clocking in:", error);
        throw error;
    }
  };

  const clockOut = async (recordId: string) => {
    try {
        const recordRef = doc(db, 'attendance', recordId);
        await updateDoc(recordRef, {
            clockOutTime: new Date().toISOString(),
        });
    } catch(error) {
        console.error("AttendanceContext: Error clocking out:", error);
        throw error;
    }
  };

  return (
    <AttendanceContext.Provider value={{ records, todaysRecords, fetchRecordsForMonth, clockIn, clockOut, loading }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
