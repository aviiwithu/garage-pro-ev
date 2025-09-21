
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { db } from '@/lib/firebase';
import { useEffect } from 'react';

const formSchema = z.object({
  gstin: z.string().optional(),
  type: z.enum(['B2B', 'B2C']),
  salutation: z.string().optional(),
  firstName: z.string().min(1, { message: 'First Name is required.' }),
  lastName: z.string().min(1, { message: 'Last Name is required.' }),
  companyName: z.string().optional(),
  displayName: z.string().min(2, { message: 'Display Name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  workPhone: z.string().optional(),
  mobile: z.string().min(10, { message: 'Mobile number is too short.' }),
  address: z.string().min(5, { message: 'Address is too short.' }),
  contactPersons: z.string().optional(),
  gstNumber: z.string().optional(),
  pan: z.string().optional(),
  vehicleNumbers: z.string().min(5, { message: 'At least one vehicle number is required.'}),
  portalStatus: z.boolean().default(true),
  remarks: z.string().optional(),
});

interface AddCustomerFormProps {
    onSuccess: () => void;
}

const LOCAL_STORAGE_KEY = 'addCustomerForm';

export function AddCustomerForm({ onSuccess }: AddCustomerFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'B2C',
      salutation: 'Mr.',
      firstName: '',
      lastName: '',
      companyName: '',
      displayName: '',
      email: '',
      mobile: '',
      address: '',
      gstNumber: '',
      pan: '',
      vehicleNumbers: '',
      portalStatus: true,
      remarks: '',
    },
  });

  useEffect(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            form.reset(JSON.parse(savedData));
        }
    } catch (e) {
        console.error("Failed to parse customer form data from localStorage", e);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
        } catch(e) {
            console.error("Failed to save customer form data to localStorage", e);
        }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
        const vehicles = values.vehicleNumbers.split(',').map(v => v.trim()).filter(v => v);
        const fullName = values.type === 'B2B' ? values.companyName : `${values.firstName} ${values.lastName}`;
        
        // Use email as a temporary ID until a real auth system is in place
        const newId = values.email.replace(/[^a-zA-Z0-9]/g, '');

        const customerData = {
            id: newId,
            name: fullName,
            displayName: values.displayName,
            type: values.type,
            email: values.email,
            workPhone: values.workPhone || '',
            mobile: values.mobile,
            address: values.address,
            gstNumber: values.gstNumber || '',
            pan: values.pan || '',
            vehicles: vehicles,
            role: 'customer',
            portalStatus: values.portalStatus ? 'Enabled' : 'Disabled',
            remarks: values.remarks || '',
        };

        await setDoc(doc(db, 'users', newId), customerData);

        toast({
            title: "Customer Created",
            description: `${fullName} has been added.`,
        });
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        onSuccess();
    } catch (error: any) {
        console.error('Error creating customer:', error);
        toast({
            title: "Error",
            description: error.message || "Failed to create customer. They may already exist.",
            variant: "destructive",
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
        <div>
          <FormField
            control={form.control}
            name="gstin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prefill with GSTIN</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="Enter GSTIN to prefill details" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" disabled>Prefill</Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Customer Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a customer type" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="B2C">Individual</SelectItem>
                          <SelectItem value="B2B">Business</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
          />
        </div>

        <Separator />
        
        <div>
            <h3 className="text-lg font-medium mb-4">Primary Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField
                  control={form.control}
                  name="salutation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salutation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Mr.">Mr.</SelectItem>
                            <SelectItem value="Mrs.">Mrs.</SelectItem>
                            <SelectItem value="Ms.">Ms.</SelectItem>
                            <SelectItem value="Miss.">Miss.</SelectItem>
                            <SelectItem value="Dr.">Dr.</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input placeholder="John" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input placeholder="ACME Inc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Display Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormItem>
                    <FormLabel>Customer Number</FormLabel>
                    <FormControl><Input disabled placeholder="Auto-generated" /></FormControl>
                </FormItem>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="workPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Phone</FormLabel>
                      <FormControl><Input placeholder="e.g., 123-456-7890" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile</FormLabel>
                      <FormControl><Input placeholder="e.g., 987-654-3210" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
        </div>

        <Separator />
        
        <div>
             <h3 className="text-lg font-medium mb-4">Other Details</h3>
             <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Textarea placeholder="123 Main St, Anytown" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="contactPersons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Contact Persons</FormLabel>
                      <FormControl><Textarea placeholder="e.g., Jane Doe - jane@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Registration Numbers</FormLabel>
                      <FormControl><Textarea placeholder="e.g., AB-123-CD, EF-456-GH" {...field} /></FormControl>
                      <FormDescription>Enter one or more vehicle numbers, separated by commas.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="pan"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>PAN</FormLabel>
                        <FormControl><Input placeholder="Permanent Account Number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="portalStatus"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Enable Portal?</FormLabel>
                            <FormDescription>Allow portal access for this customer.</FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Remarks (Internal)</FormLabel>
                        <FormControl><Textarea placeholder="Internal notes about the customer" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />

             </div>
        </div>


        <div className="flex justify-end pt-4">
          <Button type="submit">Create Customer</Button>
        </div>
      </form>
    </Form>
  );
}
