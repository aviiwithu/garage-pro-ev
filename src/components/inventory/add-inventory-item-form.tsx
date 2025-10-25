
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { InventoryPart, ServiceItem } from '@/lib/inventory-data';
import { useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { useInventory } from '@/context/InventoryContext';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Item name is too short."),
  itemType: z.enum(['Goods', 'Service']).default('Goods'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price can't be negative."),
  purchasePrice: z.coerce.number().optional(),
  gstRate: z.coerce.number().min(0, "GST Rate is required."),
  hsnSacCode: z.string().min(3, "Code is required."),
  
  // Goods only
  partNumber: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  stock: z.coerce.number().optional(),
  minStockLevel: z.coerce.number().optional(),
  supplier: z.string().optional(),
  
  // Service only
  serviceCategory: z.string().optional(),
  duration: z.string().optional(),

}).superRefine((data, ctx) => {
    if (data.itemType === 'Goods') {
        if (!data.partNumber || data.partNumber.length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Part Number is required.", path: ['partNumber'] });
        }
        if (!data.brand || data.brand.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Brand is required.", path: ['brand'] });
        }
        if (data.stock === undefined || data.stock < 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stock can't be negative.", path: ['stock'] });
        }
    }
    if (data.itemType === 'Service') {
         if (!data.serviceCategory) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Service Category is required.", path: ['serviceCategory'] });
        }
        if (!data.duration) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duration is required.", path: ['duration'] });
        }
    }
});

const defaultFormValues = {
  name: '',
  itemType: 'Goods' as const,
  description: '',
  price: 0,
  purchasePrice: 0,
  gstRate: 18,
  hsnSacCode: '',
  partNumber: '',
  brand: '',
  category: 'Mechanical',
  stock: 0,
  minStockLevel: 5,
  supplier: '',
  serviceCategory: 'Routine',
  duration: '',
};

type FormValues = z.infer<typeof formSchema>;

interface AddInventoryItemFormProps {
    onSuccess: () => void;
    item?: InventoryPart | ServiceItem;
}

export function AddInventoryItemForm({ onSuccess, item }: AddInventoryItemFormProps) {
  const { toast } = useToast();
  const { addService, batchAddOrUpdateParts, batchAddOrUpdateServices } = useInventory();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: item ? {
        ...item,
        category: item.itemType === 'Goods' ? item.category : undefined,
        serviceCategory: item.itemType === 'Service' ? item.category : undefined
    } : defaultFormValues,
  });
  
  const itemType = form.watch('itemType');

  async function onSubmit(values: FormValues) {
    try {
        if (values.itemType === 'Service') {
            const serviceData: Omit<ServiceItem, 'id'> = {
                name: values.name,
                itemType: 'Service',
                category: values.serviceCategory as ServiceItem['category'],
                description: values.description,
                price: values.price,
                gstRate: values.gstRate,
                hsnSacCode: values.hsnSacCode,
                duration: values.duration,
            };
            if (item?.id) {
                await batchAddOrUpdateServices([], [{...serviceData, id: item.id}]);
            } else {
                await addService(serviceData);
            }
        } else { // Goods
            const partData: Omit<InventoryPart, 'id'> = {
                name: values.name,
                itemType: 'Goods',
                partNumber: values.partNumber!,
                brand: values.brand!,
                category: values.category as InventoryPart['category'],
                description: values.description,
                stock: values.stock!,
                minStockLevel: values.minStockLevel || 0,
                price: values.price,
                purchasePrice: values.purchasePrice || 0,
                gstRate: values.gstRate,
                hsnSacCode: values.hsnSacCode,
                supplier: values.supplier || 'N/A',
            };
            if(item?.id){
                await batchAddOrUpdateParts([], [{...partData, id: item.id}]);
            } else {
                await batchAddOrUpdateParts([partData], []);
            }
        }

        toast({
            title: `Item ${item ? 'Updated' : 'Created'}`,
            description: `${values.name} has been successfully submitted.`,
        });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="itemType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                          <SelectItem value="Goods">Goods (Part)</SelectItem>
                          <SelectItem value="Service">Service</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{itemType === 'Goods' ? 'Part Name' : 'Service Name'}</FormLabel>
                  <FormControl>
                    <Input placeholder={itemType === 'Goods' ? "e.g., 12V Auxiliary Battery" : "e.g., Oil Change"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Enter a description for the item" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>

        <Separator />
        
        {itemType === 'Goods' && (
            <div className="space-y-4">
                <h4 className="font-medium">Part Details</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="partNumber" render={({ field }) => (
                        <FormItem><FormLabel>Part Number (SKU)</FormLabel><FormControl><Input placeholder="e.g., BT-12V-GPR" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="brand" render={({ field }) => (
                        <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g., Tesla, Generic" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Electrical">Electrical</SelectItem>
                                <SelectItem value="Mechanical">Mechanical</SelectItem>
                                <SelectItem value="Battery">Battery</SelectItem>
                                <SelectItem value="Chassis">Chassis</SelectItem>
                                <SelectItem value="Body">Body</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="supplier" render={({ field }) => (
                        <FormItem><FormLabel>Vendor</FormLabel><FormControl><Input placeholder="e.g., EV Parts Co." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </div>
        )}
        
        {itemType === 'Service' && (
             <div className="space-y-4">
                 <h4 className="font-medium">Service Details</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="serviceCategory" render={({ field }) => (
                        <FormItem><FormLabel>Service Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Routine">Routine</SelectItem>
                                <SelectItem value="Bodywork">Bodywork</SelectItem>
                                <SelectItem value="Diagnostics">Diagnostics</SelectItem>
                                <SelectItem value="AC Repair">AC Repair</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="duration" render={({ field }) => (
                        <FormItem><FormLabel>Expected Duration</FormLabel><FormControl><Input placeholder="e.g., 45 minutes" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                 </div>
             </div>
        )}

        <Separator />
        
        <div className="space-y-4">
            <h4 className="font-medium">Pricing & Taxation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>{itemType === 'Goods' ? 'Selling Price' : 'Base Price'} (Pre-Tax)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 {itemType === 'Goods' && <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                    <FormItem><FormLabel>Purchase Price (Pre-Tax)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                )} />}
                <FormField control={form.control} name="hsnSacCode" render={({ field }) => (
                    <FormItem><FormLabel>HSN / SAC Code</FormLabel><FormControl><Input placeholder="e.g., 8708 or 9987" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="gstRate" render={({ field }) => (
                    <FormItem><FormLabel>GST Rate (%)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
            </div>
        </div>

        {itemType === 'Goods' && (
            <>
                <Separator />
                <div className="space-y-4">
                    <h4 className="font-medium">Stock Management</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="stock" render={({ field }) => (
                            <FormItem><FormLabel>Opening Stock</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="minStockLevel" render={({ field }) => (
                            <FormItem><FormLabel>Reorder Point</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
            </>
        )}
        
        <div className="flex justify-end pt-4">
            <Button type="submit">{item ? 'Update' : 'Create'} Item</Button>
        </div>
      </form>
    </Form>
  );
}
