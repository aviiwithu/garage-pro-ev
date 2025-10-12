
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { amcPackages } from '@/lib/amc-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Customer } from '@/lib/customer-data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddCustomerForm } from '../customers/add-customer-form';
import { useEmployee } from '@/context/EmployeeContext';
import { useAmc } from '@/context/AmcContext';

const formSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer is required.' }),
  vehicleNumber: z.string().min(5, { message: 'Valid vehicle number is required.' }),
  vehicleCategory: z.enum(['2 Wheeler', '3 Wheeler', '4 Wheeler', 'Commercial']),
  planId: z.string().min(1, { message: 'AMC plan is required.' }),
  startDate: z.date({ required_error: 'Start date is required.' }),
});

interface AddAmcFormProps {
    onSuccess: () => void;
}

const LOCAL_STORAGE_KEY = 'addAmcForm';

export function AddAmcForm({ onSuccess }: AddAmcFormProps) {
  const { toast } = useToast();
  const { employees } = useEmployee();
  const { addAmc } = useAmc();
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  
  const customers = employees.filter(e => e.role === 'customer') as Customer[];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      vehicleNumber: '',
      vehicleCategory: '4 Wheeler',
      planId: '',
      startDate: new Date(),
    },
  });

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.startDate) {
          parsed.startDate = new Date(parsed.startDate);
        }
        form.reset(parsed);
      }
    } catch (e) {
      console.error("Failed to parse AMC form data from localStorage", e);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
      } catch (e) {
        console.error("Failed to save AMC form data to localStorage", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedCustomer = customers.find(c => c.id === values.customerId);
    const selectedPlan = amcPackages.find(p => p.id === values.planId);

    if (!selectedCustomer || !selectedPlan) {
        toast({ title: "Error", description: "Invalid customer or plan.", variant: "destructive" });
        return;
    }

    const endDate = new Date(values.startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const newAmc = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        vehicleNumber: values.vehicleNumber,
        vehicleCategory: values.vehicleCategory,
        planName: selectedPlan.name,
        startDate: values.startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'Active' as 'Active',
    };
    
    addAmc(newAmc);

    toast({
        title: "AMC Created",
        description: `A new AMC has been created for ${selectedCustomer.name}.`,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
                <FormItem className="col-span-2">
                <div className="flex justify-between items-center">
                    <FormLabel>Customer</FormLabel>
                    <Dialog open={addCustomerDialogOpen} onOpenChange={setAddCustomerDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Customer
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Customer</DialogTitle>
                                <DialogDescription>
                                    Fill in the details to create a new customer profile.
                                </DialogDescription>
                            </DialogHeader>
                            <AddCustomerForm onSuccess={() => setAddCustomerDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {customers.map(customer => (
                             <SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.email})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="vehicleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Registration No.</FormLabel>
              <FormControl>
                <Input placeholder="e.g., MH12AB1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="vehicleCategory"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Vehicle Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="2 Wheeler">2 Wheeler</SelectItem>
                        <SelectItem value="3 Wheeler">3 Wheeler</SelectItem>
                        <SelectItem value="4 Wheeler">4 Wheeler</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="planId"
            render={({ field }) => (
                <FormItem className="col-span-2">
                <FormLabel>AMC Plan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {amcPackages.map(plan => (
                             <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} (<span className="font-code">INR </span>
                                <span className="font-code">₹</span><span className="font-code">{plan.price.toLocaleString()}</span>)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem className="flex flex-col col-span-2">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="col-span-2 flex justify-end">
            <Button type="submit">Create Contract</Button>
        </div>
      </form>
    </Form>
  );
}
