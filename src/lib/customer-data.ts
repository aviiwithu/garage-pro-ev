

export type Customer = {
  id: string;
  name: string; // Company Name or Full Name
  displayName: string; // Primary Contact Name
  type: 'B2B' | 'B2C';
  email: string;
  workPhone?: string;
  mobile: string;
  address: string;
  gstNumber?: string;
  pan?: string;
  vehicles: string[]; // Array of vehicle registration numbers
  role: 'customer' | 'admin' | 'technician';
  portalStatus: 'Enabled' | 'Disabled';
  remarks?: string;
};
