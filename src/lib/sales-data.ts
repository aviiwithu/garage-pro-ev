
export type QuoteItem = {
  itemId: string;
  itemType: 'part' | 'service';
  itemName: string;
  hsnSacCode?: string;
  quantity: number;
  rate: number;
  discount?: number;
  tax?: number;
};

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted';

export type Quote = {
  id?: string;
  customerId: string;
  customerName: string; // Denormalized for easy display
  quoteNumber: string;
  quoteDate: string; // ISO String
  expiryDate?: string; // ISO String
  items: QuoteItem[];
  subTotal: number;
  totalTax: number;
  adjustment: number;
  total: number;
  status: QuoteStatus;
  createdAt: string; // ISO String
};

export type SalesOrderStatus = 'Draft' | 'Confirmed' | 'Invoiced' | 'Fulfilled' | 'Cancelled';

export type SalesOrder = {
  id?: string;
  quoteId: string; // Link back to the original quote
  customerId: string;
  customerName: string;
  salesOrderNumber: string;
  orderDate: string; // ISO String
  expectedDeliveryDate?: string; // ISO String
  items: QuoteItem[];
  total: number;
  status: SalesOrderStatus;
  createdAt: string; // ISO String
};
