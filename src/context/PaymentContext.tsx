
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';
import { createOrder, verifySignature } from '@/services/payment-gateway';
import { useToast } from '@/hooks/use-toast';
import { Payment } from '@/lib/payment-data';
import { useComplaint } from './ComplaintContext';
import { useAccounting } from './AccountingContext';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PaymentContextType {
    processPayment: (amount: number, complaintId: string, invoiceId: string) => Promise<void>;
    loading: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
    const { user, role, loading: authLoading } = useAuth();
    const { invoices } = useComplaint();
    const { markInvoiceAsPaid } = useAccounting();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const processPayment = async (amount: number, complaintId: string, invoiceId: string) => {
        if (!user) {
            toast({ title: 'Authentication Error', description: 'You must be logged in to make a payment.', variant: 'destructive' });
            return;
        }
        setLoading(true);

        try {
            const order = await createOrder(amount, invoiceId);

            const paymentOrder = {
                razorpayOrderId: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                createdAt: new Date(order.created_at * 1000).toISOString(),
                invoiceId
                // ...options
            }

            await addDoc(collection(db, 'paymentOrders'), paymentOrder);

            const options = {
                key: process.env.NEXT_PUBLIC_RZP_KEY,
                amount: order.amount,
                currency: order.currency,
                name: 'GaragePRO EV',
                description: `Payment for Invoice #${invoiceId}`,
                order_id: order.id,
                handler: async function (response: any) {
                    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

                    try {
                        const isVerified = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

                        if (isVerified) {
                            const paymentData: Omit<Payment, 'id'> = {
                                complaintId,
                                invoiceId,
                                customerId: user.id,
                                amount: Number(order.amount) / 100,
                                currency: order.currency,
                                status: 'captured',
                                razorpayOrderId: razorpay_order_id,
                                razorpayPaymentId: razorpay_payment_id,
                                razorpaySignature: razorpay_signature,
                                createdAt: new Date().toISOString(),
                            };
                            await addDoc(collection(db, 'payments'), paymentData);

                            const invoiceToUpdate = invoices.find(inv => inv.id === invoiceId);
                            if (invoiceToUpdate) {
                                await markInvoiceAsPaid(invoiceToUpdate);
                            }

                            toast({ title: 'Payment Successful', description: `Your payment of INR ${amount} was successful.` });
                        } else {
                            throw new Error("Signature verification failed.");
                        }
                    } catch (verificationError: any) {
                        toast({ title: 'Payment Verification Failed', description: verificationError.message || 'Could not verify payment. Please contact support.', variant: 'destructive' });
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone,
                },
                notes: {
                    address: user.address ?? '',
                    complaintId: complaintId,
                    invoiceId: invoiceId,
                },
                theme: {
                    color: '#034948'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', async function (response: any) {
                const paymentData: Omit<Payment, 'id'> = {
                    complaintId,
                    invoiceId,
                    customerId: user.id,
                    amount: Number(order.amount) / 100,
                    currency: order.currency,
                    status: 'failed',
                    razorpayOrderId: response.error.metadata.order_id,
                    razorpayPaymentId: response.error.metadata.payment_id,
                    errorCode: response.error.code,
                    errorDescription: response.error.description,
                    createdAt: new Date().toISOString(),
                };
                await addDoc(collection(db, 'payments'), paymentData);
                toast({ title: 'Payment Failed', description: response.error.description, variant: 'destructive' });
            });
            rzp.open();
        } catch (error: any) {
            console.error("PaymentContext: Error creating Razorpay order:", error);
            toast({ title: 'Payment Error', description: error.message || 'Could not initiate payment.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PaymentContext.Provider value={{ processPayment, loading }}>
            {children}
        </PaymentContext.Provider>
    );
};

export const usePayment = () => {
    const context = useContext(PaymentContext);
    if (context === undefined) {
        throw new Error('usePayment must be used within a PaymentProvider');
    }
    return context;
};
