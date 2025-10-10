export type Customer = {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  displayName: string; 
  type: 'B2B' | 'B2C';
  email: string;
  workPhone?: string;
  mobile: string;
  address: string;
  gstNumber?: string;
  pan?: string;
  vehicles: string[];
  role: 'customer' | 'admin' | 'technician';
  portalStatus: 'Enabled' | 'Disabled';
  remarks?: string;
  salutation?: string;
};
