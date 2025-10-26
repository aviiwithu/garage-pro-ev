export interface Payment {
    id?: string;
    complaintId: string;
    invoiceId?: string;
    customerId: string;
    amount: number;
    currency: string;
    status: 'created' | 'captured' | 'failed';
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    method?: string;
    errorCode?: string;
    errorDescription?: string;
    createdAt: string; // ISO String
}

export interface PaymentOrder {
    id: string;
    amount: number;
    createdAt: string;
    complaintId: string;
    customerId: string;
    invoiceId: string;
    status: string;
    razorpayOrderId:string;
    razorpayPaymentId:string;
}

export interface PaymentOrderResponse {
    data: PaymentOrder;
    message: string;
    status: string;
}