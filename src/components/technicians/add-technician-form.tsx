

'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Technician, SalaryStructure } from '@/lib/technician-data';
import { useEmployee } from '@/context/EmployeeContext';
import { useState, useEffect } from 'react';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Switch } from '../ui/switch';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const formSchema = z.object({
  employeeId: z.string().min(1, { message: 'Employee ID is required.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'A valid email is required for login.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }).optional(),
  phone: z.string().min(10, { message: 'A valid phone number is required.' }),
  gender: z.enum(['Male', 'Female', 'Other']),
  dateOfBirth: z.date({ required_error: 'Date of birth is required.' }),
  dateOfJoining: z.date({ required_error: 'Date of joining is required.' }),
  dateOfLeaving: z.date().optional(),
  
  title: z.string().min(2, { message: 'Title/Designation is required.' }),
  department: z.enum(['RSA', 'COCO', 'Management', 'HR', 'Finance']),
  manager: z.string().optional(),
  location: z.string().min(2, { message: 'Location is required.' }),

  panNumber: z.string().length(10, { message: 'PAN must be 10 characters.'}),
  aadhaarNumber: z.string().length(12, { message: 'Aadhaar must be 12 digits.'}),
  residentOfIndia: z.boolean().default(true),
  
  bankDetails: z.object({
      accountNumber: z.string().min(8, { message: 'Account number is required.'}),
      ifscCode: z.string().length(11, { message: 'IFSC must be 11 characters.'}),
      bankName: z.string().min(2, { message: 'Bank name is required.'}),
  }),
  
  stopSalary: z.boolean().default(false),
  pf: z.boolean().default(true),
  pfStatus: z.enum(['Active', 'Inactive']),
  uan: z.string().optional(),
  esicStatus: z.enum(['Active', 'Inactive']),
  esicIpNumber: z.string().optional(),
  
  salaryStructure: z.object({
    basic: z.coerce.number().positive({ message: 'Basic salary must be positive.' }),
    hra: z.coerce.number().min(0, { message: 'HRA cannot be negative.' }),
    allowances: z.array(z.object({
      name: z.string().min(2, { message: 'Allowance name is required.' }),
      amount: z.coerce.number().min(0, { message: 'Amount must be positive.' }),
    })).optional(),
    deductions: z.array(z.object({
      name: z.string().min(2, { message: 'Deduction name is required.' }),
      amount: z.coerce.number().min(0, { message: 'Amount must be positive.' }),
    })).optional(),
  }),
});

const formSchemaWithPassword = formSchema.extend({
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const defaultFormValues = {
  employeeId: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  gender: 'Male' as const,
  dateOfBirth: undefined,
  dateOfJoining: new Date(),
  title: '',
  department: 'COCO' as const,
  location: 'Main Branch',
  panNumber: '',
  aadhaarNumber: '',
  residentOfIndia: true,
  bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
  },
  stopSalary: false,
  pf: true,
  pfStatus: 'Active' as const,
  uan: '',
  esicStatus: 'Active' as const,
  esicIpNumber: '',
  salaryStructure: {
    basic: 0,
    hra: 0,
    allowances: [],
    deductions: [],
  },
};

interface AddTechnicianFormProps {
    onSuccess: () => void;
    technician?: Technician;
}

const LOCAL_STORAGE_KEY_PREFIX = 'addTechnicianForm_';

export function AddTechnicianForm({ onSuccess, technician }: AddTechnicianFormProps) {
  const { toast } = useToast();
  const { addTechnician, updateTechnician, employees } = useEmployee();
  const [loading, setLoading] = useState(false);
  const formId = technician?.id || 'new';
  const LOCAL_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}${formId}`;


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(technician ? formSchema : formSchemaWithPassword),
    defaultValues: technician ? {
      ...technician,
      password: '', // Don't pre-fill password
      dateOfBirth: new Date(technician.dateOfBirth),
      dateOfJoining: new Date(technician.dateOfJoining),
      dateOfLeaving: technician.dateOfLeaving ? new Date(technician.dateOfLeaving) : undefined,
    } : defaultFormValues,
  });

   useEffect(() => {
    if (technician) {
      form.reset({
        ...technician,
        password: '',
        dateOfBirth: new Date(technician.dateOfBirth),
        dateOfJoining: new Date(technician.dateOfJoining),
        dateOfLeaving: technician.dateOfLeaving ? new Date(technician.dateOfLeaving) : undefined,
      });
    } else {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData.dateOfBirth) parsedData.dateOfBirth = new Date(parsedData.dateOfBirth);
          if (parsedData.dateOfJoining) parsedData.dateOfJoining = new Date(parsedData.dateOfJoining);
          if (parsedData.dateOfLeaving) parsedData.dateOfLeaving = new Date(parsedData.dateOfLeaving);
          form.reset(parsedData);
        } catch (e) {
          console.error("Failed to parse technician form data from localStorage", e);
          form.reset(defaultFormValues);
        }
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [technician, form, LOCAL_STORAGE_KEY]);

  useEffect(() => {
      if (!technician) {
        const subscription = form.watch((value) => {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
        });
        return () => subscription.unsubscribe();
      }
  }, [form, technician, LOCAL_STORAGE_KEY]);


  const { fields: allowanceFields, append: appendAllowance, remove: removeAllowance } = useFieldArray({
    control: form.control,
    name: "salaryStructure.allowances",
  });

  const { fields: deductionFields, append: appendDeduction, remove: removeDeduction } = useFieldArray({
    control: form.control,
    name: "salaryStructure.deductions",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        const dataToSave = {
            ...values,
            role: 'technician',
            dateOfBirth: values.dateOfBirth.toISOString(),
            dateOfJoining: values.dateOfJoining.toISOString(),
            dateOfLeaving: values.dateOfLeaving ? values.dateOfLeaving.toISOString() : undefined,
            specialization: 'General', // Default value
            designation: values.title, // Map title to designation
        };
        
        // This is a mock implementation since we can't create real auth users.
        // In a real app, you would use Firebase Auth.
        if (technician) {
            await updateTechnician(technician.id, dataToSave as Partial<Technician>);
        } else {
            // Since we can't create a real auth user, we'll just add to the 'users' collection
            const newId = doc(db, 'users', 'temp-id').id; // Generate a client-side ID
            await addTechnician({ ...dataToSave, id: newId } as Technician);
        }
        
        toast({
            title: `Employee ${technician ? 'Updated' : 'Added'}`,
            description: `${values.name} has been successfully ${technician ? 'updated' : 'added'}.`,
        });
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        onSuccess();
    } catch (error: any) {
        console.error("Error saving employee:", error);
        toast({
            title: 'Error',
            description: error.message || `Failed to ${technician ? 'update' : 'add'} employee.`,
            variant: 'destructive'
        })
    } finally {
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
        <div>
            <h3 className="text-lg font-medium">Personal & Login Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <FormField control={form.control} name="employeeId" render={({ field }) => (
                    <FormItem><FormLabel>Employee ID</FormLabel><FormControl><Input placeholder="e.g., EMP001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="lg:col-span-2"><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Alice Johnson" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Login Email</FormLabel><FormControl><Input type="email" placeholder="tech@garagepro.com" {...field} disabled={!!technician} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>{technician ? 'New Password (Optional)' : 'Password'}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                        </Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                    </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1960} toYear={2010} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="dateOfJoining" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date of Joining</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                    </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
            </div>
        </div>
        
        <Separator />

         <div>
            <h3 className="text-lg font-medium">Work Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                 <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title / Designation</FormLabel><FormControl><Input placeholder="e.g., Senior Technician" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem><FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="RSA">RSA</SelectItem><SelectItem value="COCO">COCO</SelectItem><SelectItem value="Management">Management</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Finance">Finance</SelectItem></SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="manager" render={({ field }) => (
                    <FormItem><FormLabel>Manager</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="location" render={({ field }) => (
                     <FormItem className="lg:col-span-3"><FormLabel>Work Location / Branch</FormLabel><FormControl><Input placeholder="e.g., Main Branch" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
        </div>
        
        <Separator />
        
         <div>
            <h3 className="text-lg font-medium">Statutory Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <FormField control={form.control} name="panNumber" render={({ field }) => (
                    <FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input placeholder="ABCDE1234F" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="aadhaarNumber" render={({ field }) => (
                    <FormItem><FormLabel>Aadhaar Number</FormLabel><FormControl><Input placeholder="123456789012" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="residentOfIndia" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-8"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Resident of India</FormLabel><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="pf" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-8"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>PF Enabled</FormLabel><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="pfStatus" render={({ field }) => (
                    <FormItem><FormLabel>PF Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="uan" render={({ field }) => (
                    <FormItem><FormLabel>UAN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="esicStatus" render={({ field }) => (
                    <FormItem><FormLabel>ESIC Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="esicIpNumber" render={({ field }) => (
                    <FormItem className="lg:col-span-2"><FormLabel>ESIC IP Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
        </div>
        
        <Separator />
        
        <div>
            <h3 className="text-lg font-medium">Bank Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <FormField control={form.control} name="bankDetails.bankName" render={({ field }) => (
                    <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bankDetails.accountNumber" render={({ field }) => (
                    <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bankDetails.ifscCode" render={({ field }) => (
                    <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>
        
        <Separator />
        
        <div>
            <h3 className="text-lg font-medium">Salary Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <FormField control={form.control} name="salaryStructure.basic" render={({ field }) => (
                    <FormItem><FormLabel>Basic Salary</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="salaryStructure.hra" render={({ field }) => (
                    <FormItem><FormLabel>House Rent Allowance (HRA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <div className="mt-4">
                <FormLabel>Allowances</FormLabel>
                {allowanceFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 mt-2">
                        <FormField control={form.control} name={`salaryStructure.allowances.${index}.name`} render={({ field }) => (
                           <FormItem className="flex-1"><FormControl><Input placeholder="Allowance Name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`salaryStructure.allowances.${index}.amount`} render={({ field }) => (
                           <FormItem className="flex-1"><FormControl><Input type="number" placeholder="Amount" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAllowance(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAllowance({ name: '', amount: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Allowance
                </Button>
            </div>
            
            <div className="mt-4">
                <FormLabel>Deductions</FormLabel>
                {deductionFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 mt-2">
                        <FormField control={form.control} name={`salaryStructure.deductions.${index}.name`} render={({ field }) => (
                           <FormItem className="flex-1"><FormControl><Input placeholder="Deduction Name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`salaryStructure.deductions.${index}.amount`} render={({ field }) => (
                           <FormItem className="flex-1"><FormControl><Input type="number" placeholder="Amount" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDeduction(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendDeduction({ name: '', amount: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Deduction
                </Button>
            </div>
             <FormField control={form.control} name="stopSalary" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-8"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Stop Salary Payment</FormLabel><FormMessage /></FormItem>
            )} />
        </div>
        
        <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {technician ? 'Update' : 'Add'} Employee
        </Button>
      </form>
    </Form>
  );
}
