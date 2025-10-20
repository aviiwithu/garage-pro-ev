
import { InventoryPart, ServiceItem } from './inventory-data';

export type ComplaintStatus = 'Open' | 'Technician Assigned' | 'Estimate Shared' | 'Estimate Approved' | 'In Progress' | 'Resolved' | 'Closed';

export type StatusHistory = {
  status: ComplaintStatus;
  timestamp: string;
};

export type JobItems = {
  parts: InventoryPart[];
  services: ServiceItem[];
}

export type Complaint = {
  id: string;
  customerName: string;
  vehicleNumber: string;
  registrationNumber: string; // Added to match form data
  vehicleModel: string;
  status: ComplaintStatus;
  issue: string;
  assignedTo: string;
  createdAt: string; // ISO Date string
  resolvedAt?: string; // ISO Date string
  statusHistory: StatusHistory[];
  estimatedItems: JobItems;
  actualItems: JobItems;
  attachmentUrls?: string[];
  customerId:string;
};
