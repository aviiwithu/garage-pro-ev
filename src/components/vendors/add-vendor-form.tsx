
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useVendor } from '@/context/VendorContext';
import { Textarea } from '../ui/textarea';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Vendor name is required.' }),
  category: z.string().min(2, { message: 'Category is required.' }),
  tier: z.enum(['Strategic Partner', 'Preferred Supplier', 'Transactional']),
  status: z.enum(['Active', 'Inactive', 'Pending Approval']),
  contact: z.object({
    name: z.string().min(2, { message: 'Contact name is required.' }),
    email: z.string().email({ message: 'A valid email is required.' }),
    phone: z.string().min(10, { message: 'A valid phone number is required.' }),
  }),
  address: z.string().min(10, { message: 'Address is required.' }),
  gstNumber: z.string().length(15, { message: 'GST Number must be 15 characters.' }),
});

interface AddVendorFormProps {
    onSuccess: () => void;
}

const LOCAL_STORAGE_KEY = 'addVendorForm';

export function AddVendorForm({ onSuccess }: AddVendorFormProps) {
  const { toast } = useToast();
  const { addVendor } = useVendor();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      tier: 'Transactional',
      status: 'Pending Approval',
      contact: { name: '', email: '', phone: '' },
      address: '',
      gstNumber: '',
    },
  });

  useEffect(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            form.reset(JSON.parse(savedData));
        }
    } catch (e) {
        console.error("Failed to parse vendor form data from localStorage", e);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
        } catch (e) {
            console.error("Failed to save vendor form data to localStorage", e);
        }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    await addVendor(values);
    toast({
        title: "Vendor Added",
        description: `${values.name} has been added and is pending approval.`,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input placeholder="e.g., EV Parts Inc." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Parts Supplier" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="tier" render={({ field }) => (
                <FormItem><FormLabel>Tier</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="Strategic Partner">Strategic Partner</SelectItem><SelectItem value="Preferred Supplier">Preferred Supplier</SelectItem><SelectItem value="Transactional">Transactional</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="Pending Approval">Pending Approval</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="gstNumber" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>GST Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Full Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <div className="space-y-2 pt-4">
             <h4 className="font-medium">Primary Contact</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="contact.name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact.email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact.phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
        </div>
        <div className="flex justify-end pt-4">
            <Button type="submit">Add Vendor</Button>
        </div>
      </form>
    </Form>
  );
}
