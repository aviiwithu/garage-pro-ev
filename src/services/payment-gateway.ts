'use server';

import Razorpay from "razorpay";
import crypto from 'crypto';

const instance = new Razorpay({ key_id: process.env.RZP_KEY, key_secret: process.env.RZP_SECRET });

export const createOrder = async (amount: number, invoice_id: string, options?: Record<string, string>) => {
    const orderOptions = {
        amount: amount * 100,
        currency: "INR",
        receipt: invoice_id,
        notes: options || {}
    };
    const order = await instance.orders.create(orderOptions);
    return order;
}

const generatedSignature = (razorpayOrderId: string, razorpayPaymentId: string) => {
    const secret = process.env.RZP_SECRET;
    if (!secret) {
        throw new Error(
            'Razorpay key secret is not defined in environment variables.'
        );
    }
    const sig = crypto.createHmac('sha256', secret).update(razorpayOrderId + '|' + razorpayPaymentId).digest('hex');
    return sig;
};

export const verifySignature = async(rzpOrderId: string, rzpPaymentId: string, rzpSignature: string) => {
    const signature = generatedSignature(rzpOrderId, rzpPaymentId);
    if (signature !== rzpSignature) {
        return false
    }
    return true

}