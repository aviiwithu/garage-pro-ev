export type Customer = {
  id: string;
  name?: string;
  companyName?: string;
  displayName: string; 
  type: 'B2B' | 'B2C';
  email: string;
  workPhone?: string;
  phone: string;
  address: string;
  gstNumber?: string;
  pan?: string;
  vehicles: string[];
  role: 'customer' | 'admin' | 'technician';
  portalStatus: 'Enabled' | 'Disabled';
  remarks?: string;
  salutation?: string;
};
