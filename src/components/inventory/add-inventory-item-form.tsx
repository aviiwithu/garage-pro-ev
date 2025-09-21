
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { InventoryPart } from '@/lib/inventory-data';
import { useEffect } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { useInventory } from '@/context/InventoryContext';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Part name is too short."),
  partNumber: z.string().min(3, "Part number is required."), // SKU
  brand: z.string().min(2, "Brand is required."),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['Electrical', 'Mechanical', 'Battery', 'Chassis', 'Body']),
  stock: z.coerce.number().min(0, "Stock can't be negative."),
  minStockLevel: z.coerce.number().min(0, "Minimum stock can't be negative."),
  price: z.coerce.number().min(0, "Price can't be negative."), // Selling Rate
  gstRate: z.coerce.number().min(0, "GST Rate is required."),
  hsnSacCode: z.string().min(4, "HSN/SAC Code is required."),
  supplier: z.string().min(2, "Supplier name is required."),
  purchasePrice: z.coerce.number().min(0, "Purchase rate must be positive.").optional(),
  purchaseAccount: z.string().optional(),
  purchaseAccountCode: z.string().optional(),
  inventoryAccount: z.string().optional(),
  inventoryAccountCode: z.string().optional(),
  itemType: z.enum(['Goods', 'Service']).default('Goods'),
  usageUnit: z.string().optional(),
  taxable: z.boolean().default(true),
});

const defaultFormValues = {
  name: '',
  partNumber: '',
  brand: '',
  manufacturer: '',
  description: '',
  category: 'Mechanical' as const,
  stock: 0,
  minStockLevel: 5,
  price: 0,
  gstRate: 18,
  hsnSacCode: '',
  supplier: '',
  purchasePrice: 0,
  purchaseAccount: 'Cost of Goods Sold',
  purchaseAccountCode: '5001',
  inventoryAccount: 'Inventory Asset',
  inventoryAccountCode: '1401',
  itemType: 'Goods' as const,
  usageUnit: 'Nos',
  taxable: true,
};

interface AddInventoryItemFormProps {
    onSuccess: () => void;
    item?: InventoryPart;
}

const LOCAL_STORAGE_KEY_PREFIX = 'addInventoryItemForm_';

export function AddInventoryItemForm({ onSuccess, item }: AddInventoryItemFormProps) {
  const { toast } = useToast();
  const { batchAddOrUpdateParts } = useInventory();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: item || defaultFormValues,
  });
  
  const formId = item?.id || 'new';
  const LOCAL_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}${formId}`;

  useEffect(() => {
    if (item) {
        form.reset(item);
    } else {
      try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            form.reset(JSON.parse(savedData));
        } else {
          form.reset(defaultFormValues);
        }
      } catch (e) {
          console.error("Failed to parse inventory form data from localStorage", e);
          form.reset(defaultFormValues);
      }
    }
  }, [item, form, LOCAL_STORAGE_KEY]);

  useEffect(() => {
    const subscription = form.watch((value) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form, LOCAL_STORAGE_KEY]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
        if (item) { // This is an update
            await batchAddOrUpdateParts([], [values as InventoryPart]);
        } else { // This is a new item
            await batchAddOrUpdateParts([values], []);
        }

        toast({
            title: `Item ${item ? 'Updated' : 'Created'}`,
            description: `${values.name} has been successfully submitted.`,
        });
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        onSuccess();
    } catch (error) {
         toast({
            title: "Submission Failed",
            description: "An error occurred while saving the item.",
            variant: "destructive"
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="lg:col-span-2">
              <FormLabel>Part Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 12V Auxiliary Battery" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="itemType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Goods">Goods</SelectItem><SelectItem value="Service">Service</SelectItem></SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem className="lg:col-span-3"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Enter a description for the item" {...field} /></FormControl><FormMessage /></FormItem>
        )} />


        <FormField
          control={form.control}
          name="partNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part Number (SKU)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., BT-12V-GPR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Tesla, Generic" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="manufacturer" render={({ field }) => (
            <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input placeholder="e.g., ACME Corp" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                        <SelectItem value="Battery">Battery</SelectItem>
                        <SelectItem value="Chassis">Chassis</SelectItem>
                        <SelectItem value="Body">Body</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField control={form.control} name="hsnSacCode" render={({ field }) => (
            <FormItem><FormLabel>HSN/SAC Code</FormLabel><FormControl><Input placeholder="e.g., 8708" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="usageUnit" render={({ field }) => (
            <FormItem><FormLabel>Usage Unit</FormLabel><FormControl><Input placeholder="e.g., Nos, Kgs" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem><FormLabel>Selling Price (Pre-Tax)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="purchasePrice" render={({ field }) => (
            <FormItem><FormLabel>Purchase Price (Pre-Tax)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField
            control={form.control}
            name="taxable"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-center rounded-lg border p-3 mt-8">
                <div className="space-y-0.5">
                    <FormLabel>Taxable</FormLabel>
                </div>
                <FormControl className="ml-auto">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                </FormItem>
            )}
        />
        <FormField control={form.control} name="gstRate" render={({ field }) => (
            <FormItem><FormLabel>GST Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="purchaseAccount" render={({ field }) => (
            <FormItem><FormLabel>Purchase Account</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="purchaseAccountCode" render={({ field }) => (
            <FormItem><FormLabel>Purchase Account Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField control={form.control} name="inventoryAccount" render={({ field }) => (
            <FormItem><FormLabel>Inventory Account</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="inventoryAccountCode" render={({ field }) => (
            <FormItem><FormLabel>Inventory Account Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField control={form.control} name="stock" render={({ field }) => (
            <FormItem><FormLabel>Opening Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="minStockLevel" render={({ field }) => (
            <FormItem><FormLabel>Reorder Point</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="supplier" render={({ field }) => (
            <FormItem><FormLabel>Vendor</FormLabel><FormControl><Input placeholder="e.g., EV Parts Co." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <div className="lg:col-span-3 flex justify-end">
            <Button type="submit">{item ? 'Update' : 'Create'} Item</Button>
        </div>
      </form>
    </Form>
  );
}
