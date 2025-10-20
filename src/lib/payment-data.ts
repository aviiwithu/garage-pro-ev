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