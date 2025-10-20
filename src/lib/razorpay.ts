
// Type definition for Razorpay order
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

// Type definition for Razorpay payment
export interface RazorpayPayment {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  status: string;
  order_id: string;
  amount: number;
  currency: string;
  method: string;
  email: string;
  contact: string;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  captured: boolean;
  created_at: number;
}