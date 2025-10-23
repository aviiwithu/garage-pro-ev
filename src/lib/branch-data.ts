
export type Branch = {
  id: string;
  branchCode: string;
  name: string;
  location: string;
  manager: string;
  contact: string;
  status: 'Active' | 'Inactive';
};

// This file is now deprecated. Data is loaded from /lib/data/branches.csv via a server action.
export const branches: Branch[] = [];
