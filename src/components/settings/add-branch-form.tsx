
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useEffect } from 'react';

const formSchema = z.object({
  branchName: z.string().min(3, { message: 'Branch name is required.' }),
  address: z.string().min(10, { message: 'Address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  state: z.string().min(2, { message: 'State is required.' }),
  pincode: z.string().length(6, { message: 'Pincode must be 6 digits.' }),
  contactNumber: z.string().min(10, { message: 'A valid contact number is required.' }),
  email: z.string().email({ message: 'A valid email is required.' }),
  branchManager: z.string().min(2, { message: 'Branch manager name is required.' }),
});

interface AddBranchFormProps {
    onSuccess: () => void;
}

const LOCAL_STORAGE_KEY = 'addBranchForm';

export function AddBranchForm({ onSuccess }: AddBranchFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchName: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      contactNumber: '',
      email: '',
      branchManager: '',
    },
  });

  useEffect(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            form.reset(JSON.parse(savedData));
        }
    } catch (e) {
        console.error("Failed to parse branch form data from localStorage", e);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
        } catch (e) {
            console.error("Failed to save branch form data to localStorage", e);
        }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you would call a context method or API to save the data.
    console.log(values);
    toast({
        title: "Branch Added",
        description: `${values.branchName} has been successfully registered.`,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="branchName" render={({ field }) => (
            <FormItem className="col-span-2"><FormLabel>Branch Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem className="col-span-2"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="state" render={({ field }) => (
            <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="pincode" render={({ field }) => (
            <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
           <FormField control={form.control} name="branchManager" render={({ field }) => (
            <FormItem><FormLabel>Branch Manager</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a manager"/></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="John Doe">John Doe</SelectItem>
                        <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                        <SelectItem value="Admin User">Admin User</SelectItem>
                    </SelectContent>
                </Select>
            <FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="contactNumber" render={({ field }) => (
            <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit">Add Branch</Button>
        </div>
      </form>
    </Form>
  );
}
