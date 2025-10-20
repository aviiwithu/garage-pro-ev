
import { ServiceItem, InventoryPart } from './inventory-data';

export type Invoice = {
  id: string;
  complaintId: string;
  customerName: string;
  customerId: string;
  vehicleNumber: string;
  date: string; // ISO Date string
  services: ServiceItem[];
  parts: InventoryPart[];
  total: number;
  status: 'Paid' | 'Unpaid';
};
