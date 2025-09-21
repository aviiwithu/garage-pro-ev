
export type VendorTier = 'Strategic Partner' | 'Preferred Supplier' | 'Transactional';

export type VendorStatus = 'Active' | 'Inactive' | 'Pending Approval';

export type Vendor = {
  id: string;
  name: string;
  category: string; // e.g., 'Parts Supplier', 'Service Provider', 'Logistics'
  tier: VendorTier;
  status: VendorStatus;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  address: string;
  gstNumber: string;
  createdAt: string; // ISO String
};

export type VendorPerformance = {
  id: string;
  vendorId: string;
  vendorName: string;
  period: string; // e.g., 'YYYY-MM'
  scores: {
    deliveryReliability: number; // 0-100
    qualityConsistency: number; // 0-100
    priceCompetitiveness: number; // 0-100
    responsiveness: number; // 0-100
  };
  overallScore: number;
  notes: string;
};

export type VendorContract = {
    id: string;
    vendorId: string;
    vendorName: string;
    title: string;
    startDate: string; // ISO String
    endDate: string; // ISO String
    status: 'Active' | 'Expired' | 'Terminated';
    documentUrl: string; // Link to the contract document in storage
};
