
export type AMCPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  recommended: boolean;
};

export const amcPackages: AMCPlan[] = [
  {
    id: 'plan_basic',
    name: 'Basic Care',
    description: 'For light-use vehicles, covering essential checks and services.',
    price: 29999,
    features: [
      '1 General Service per year',
      'Basic Diagnostics',
      'Tire Pressure Check',
      'Fluid Top-ups',
      '5% Discount on Parts'
    ],
    recommended: false,
  },
  {
    id: 'plan_standard',
    name: 'Standard Service',
    description: 'Our most popular plan for regular commuters and family vehicles.',
    price: 49999,
    features: [
      '2 General Services per year',
      'Comprehensive Diagnostics',
      'Tire Rotation & Balancing',
      'Brake Inspection',
      'Battery Health Check',
      '10% Discount on Parts',
      'Roadside Assistance'
    ],
    recommended: true,
  },
  {
    id: 'plan_premium',
    name: 'Premium Plus',
    description: 'The ultimate care package for high-mileage and performance EVs.',
    price: 79999,
    features: [
      '4 General Services per year',
      'Advanced Diagnostics & Software Updates',
      'Wheel Alignment, Rotation & Balancing',
      'Full Brake Service',
      'Detailed Battery & Powertrain Analysis',
      '15% Discount on Parts',
      'Priority Roadside Assistance',
      'Annual Interior & Exterior Detailing'
    ],
    recommended: false,
  },
];

export type AmcVehicleCategory = '2 Wheeler' | '3 Wheeler' | '4 Wheeler' | 'Commercial';

export type AMC = {
  id?: string;
  customerId: string;
  customerName: string;
  vehicleNumber: string;
  vehicleCategory: AmcVehicleCategory;
  planName: string;
  startDate: string; // ISO Date String
  endDate: string; // ISO Date String
  status: 'Active' | 'Expired' | 'Cancelled';
};
