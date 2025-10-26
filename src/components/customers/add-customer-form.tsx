
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
import { setDoc, doc } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { auth, db } from '@/lib/firebase';
import { useEffect } from 'react';
import { ChipInput } from '../ui/chip-input';
import { createUserWithEmailAndPasswordByAdmin } from '@/lib/firebase-admin';

const formSchema = z.object({
  gstin: z.string().optional(),
  type: z.enum(['B2B', 'B2C']),
  salutation: z.string().optional(),
  name: z.string().optional(),
  companyName: z.string().optional(),
  displayName: z.string().min(2, { message: 'Display Name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().regex(/^[6-9]\d{9}$/, "A valid 10-digit Indian contact number is required."),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  address: z.string().min(5, { message: 'Address is too short.' }),
  contactPersons: z.string().optional(),
  gstNumber: z.string().optional(),
  pan: z.string().optional(),
  vehicleNumbers: z.array(z.string()).nonempty({ message: 'At least one vehicle number is required.' }),
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
      gstin: "",
      type: 'B2C',
      salutation: 'Mr.',
      name: '',
      companyName: '',
      displayName: '',
      email: '',
      phone: '',
      password: '',
      address: '',
      gstNumber: '',
      pan: '',
      vehicleNumbers: [],
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
      } catch (e) {
        console.error("Failed to save customer form data to localStorage", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { email, password, type, companyName, name, displayName, phone, address, gstNumber, pan, portalStatus, remarks, salutation, vehicleNumbers } = values;

      const {success,data:user,message} = await createUserWithEmailAndPasswordByAdmin({email,displayName:name||displayName,password});
      if(!user){
        throw new Error(message);
      }
      
      // The admin API returns a user object; assert the shape so TypeScript knows it has a uid.
      const createdUser = user as { uid: string };

      const customerData: any = {
        id: createdUser.uid,
        displayName: displayName,
        type: type,
        email: email,
        phone: phone,
        address: address,
        gstNumber: gstNumber || '',
        pan: pan || '',
        vehicles: vehicleNumbers,
        role: 'customer',
        portalStatus: portalStatus ? 'Enabled' : 'Disabled',
        remarks: remarks || '',
        salutation: salutation,
        name: name,
        companyName:companyName
      };

      // console.log(customerData);
      

      // if (type === 'B2B') {
      //     customerData.companyName = companyName;
      // } else {
      //     customerData.name = name;
      // }

      await setDoc(doc(db, 'users', user.uid), customerData);

      toast({
        title: "Customer Created",
        description: `${displayName || name} has been added.`,
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
        {/* <div>
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
        </div> */}

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
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="John" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
          {
            form.getValues().type === "B2B" &&
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
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Enter GSTIN" {...field} />
                      </FormControl>
                      {/* <Button type="button" variant="outline" disabled>Prefill</Button> */}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          }

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
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

          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="98765 43210"
                          className="pl-16"
                          maxLength={10}
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            field.onChange(value);
                          }}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <span
                            className="text-gray-500 sm:text-sm"
                          >
                            🇮🇳 +91
                          </span>
                        </div>
                      </div>
                    </div>
                  </FormControl>
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
                  <FormControl>
                    <ChipInput {...field} placeholder="Enter a vehicle number and press Enter" />
                  </FormControl>
                  <FormDescription>Enter one or more vehicle numbers.</FormDescription>
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter a password for the customer portal" {...field} />
                  </FormControl>
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
