
export type SalaryStructure = {
  basic: number;
  hra: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
};

export type Technician = {
  id: string;
  employeeId: string;
  name: string;
  address?:string;
  email: string;
  phone: string;
  displayName?: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // ISO String
  dateOfJoining: string; // ISO String
  dateOfLeaving?: string; // ISO String
  role: 'technician';
  title: string; // Replaces designation
  department: 'RSA' | 'COCO' | 'Management' | 'HR' | 'Finance';
  manager?: string; // Replaces reportingManager
  location: string[];
  panNumber: string;
  aadhaarNumber: string;
  residentOfIndia: boolean;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  stopSalary: boolean;
  pf: boolean;
  pfStatus: 'Active' | 'Inactive';
  uan?: string;
  esicStatus: 'Active' | 'Inactive';
  esicIpNumber?: string;
  specialization: 'General' | 'Battery' | 'Electrical' | 'Mechanical' | 'Bodywork';
  designation: string;
  salaryStructure: SalaryStructure;
};

export type TechnicianBulkUpload={
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  displayName?: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  dateOfJoining: string;
  dateOfLeaving?: string;
  department: 'RSA' | 'COCO' | 'Management' | 'HR' | 'Finance';
  manager?: string;
  location: string | string[];
  panNumber: string;
  aadhaarNumber: string;
  residentOfIndia: boolean;
  "bankDetails.accountNumber": string;
  "bankDetails.ifscCode": string;
  "bankDetails.bankName": string;
  stopSalary: boolean;
  pf: boolean;
  pfStatus: 'Active' | 'Inactive';
  uan?: string;
  esicStatus: 'Active' | 'Inactive';
  esicIpNumber?: string;
  specialization: 'General' | 'Battery' | 'Electrical' | 'Mechanical' | 'Bodywork';
  designation: string;
  "salaryStructure.basic": number;
  "salaryStructure.hra": number;
  "salaryStructure.allowances": string;
  "salaryStructure.deductions": string;
}

