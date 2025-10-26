
'use client';

import React, { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { ComplaintProvider } from './ComplaintContext';
import { EmployeeProvider } from './EmployeeContext';
import { InventoryProvider } from './InventoryContext';
import { AccountingProvider } from './AccountingContext';
import { AmcProvider } from './AmcContext';
import { AttendanceProvider } from './AttendanceContext';
import { SalesProvider } from './SalesContext';
import { VendorProvider } from './VendorContext';
import { Loader2 } from 'lucide-react';
import { PaymentProvider } from './PaymentContext';

export function DataProvider({ children }: { children: ReactNode }) {
    const { loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <EmployeeProvider>
            <ComplaintProvider>
                <InventoryProvider>
                    <AccountingProvider>
                        <AmcProvider>
                            <AttendanceProvider>
                                <SalesProvider>
                                    <VendorProvider>
                                       <PaymentProvider>
                                            {children}
                                        </PaymentProvider>
                                    </VendorProvider>
                                </SalesProvider>
                            </AttendanceProvider>
                        </AmcProvider>
                    </AccountingProvider>
                </InventoryProvider>
            </ComplaintProvider>
        </EmployeeProvider>
    );
}
