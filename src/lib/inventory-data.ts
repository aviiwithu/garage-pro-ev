
export type InventoryPart = {
  id?: string;
  partNumber: string; // SKU
  name: string;
  brand: string;
  manufacturer?: string;
  description?: string;
  category: 'Electrical' | 'Mechanical' | 'Battery' | 'Chassis' | 'Body';
  stock: number;
  minStockLevel: number;
  price: number; // Selling Price (pre-tax)
  gstRate: number; // e.g., 5, 12, 18, 28
  hsnSacCode: string; // HSN for goods
  supplier: string;
  purchasePrice?: number; // Purchase Cost / Rate
  purchaseAccount?: string;
  purchaseAccountCode?: string;
  inventoryAccount?: string;
  inventoryAccountCode?: string;
  itemType?: 'Goods'; // Product Type
  usageUnit?: string;
  taxable?: boolean;
};

export type ServiceItem = {
    id?: string;
    name: string;
    description?: string;
    category: 'Routine' | 'Bodywork' | 'Diagnostics' | 'AC Repair' | 'Other';
    price: number; // Base Price (pre-tax)
    gstRate: number; // e.g., 5, 12, 18, 28
    hsnSacCode: string; // SAC for services
    duration?: string; // e.g. "45 minutes"
    itemType?: 'Service';
};
