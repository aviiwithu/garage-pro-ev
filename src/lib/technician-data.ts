
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
  email: string;
  phone: string;
  displayName?:string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // ISO String
  dateOfJoining: string; // ISO String
  dateOfLeaving?: string; // ISO String

  role: 'technician';
  title: string; // Replaces designation
  department: 'RSA' | 'COCO' | 'Management' | 'HR' | 'Finance';
  manager?: string; // Replaces reportingManager
  location: string;

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
  
  // Kept for backward compatibility but can be phased out
  specialization: 'General' | 'Battery' | 'Electrical' | 'Mechanical'| 'Bodywork';
  designation: string; // Now handled by 'title'
  
  salaryStructure: SalaryStructure;
};
