
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Loader2, UploadCloud } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';

const formSchema = z.object({
  // Branch Info
  branch: z.string().min(1, "Branch is required."),
  
  // Vehicle Information
  vehicleType: z.string().min(1, "Vehicle type is required."),
  vehicleModel: z.string(),
  registrationNumber: z.string().min(5, "Valid registration number is required."),
  
  // Customer Details
  customerType: z.string().min(1, "Customer type is required."),
  customerName: z.string().min(2, "Name is required."),
  contactNumber: z.string().min(10, "A valid contact number is required."),
  email: z.string().email("A valid email is required."),
  
  // Complaint Specifics
  issue: z.string().min(5, "Issue title is too short."), // Changed from issueTitle
  issueType: z.string().min(1, "Issue type is required."),
  resolutionType: z.string().min(1, "Resolution type is required."),
  priority: z.string().min(1, "Priority level is required."),
  detailedIssue: z.string().min(10, "Please describe the issue in more detail."), // Renamed for clarity in form, maps to `issue` in context
  incidentLocation: z.string().optional(),
  incidentDate: z.date().optional(),
});

type ComplaintFormValues = z.infer<typeof formSchema>;

interface ComplaintFormProps {
    onSubmit: (data: ComplaintFormValues, attachments: FileList | null) => void;
}

const LOCAL_STORAGE_KEY = 'complaintForm';

export function ComplaintForm({ onSubmit }: ComplaintFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [attachments, setAttachments] = useState<FileList | null>(null);

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branch: 'Main Branch',
      vehicleType: '4 Wheeler',
      vehicleModel: '',
      registrationNumber: '',
      customerType: 'B2C',
      customerName: '',
      contactNumber: '',
      email: '',
      issue: '',
      issueType: 'General Service',
      resolutionType: 'Workshop',
      priority: 'Medium',
      detailedIssue: '',
      incidentLocation: '',
      incidentDate: undefined,
    },
  });

  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.incidentDate) {
          parsedData.incidentDate = new Date(parsedData.incidentDate);
        }
        form.reset(parsedData);
      } catch (e) {
        console.error("Failed to parse complaint form data from localStorage", e);
      }
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  async function handleFormSubmit(values: ComplaintFormValues) {
    setIsSubmitting(true);
    // The parent component's `onSubmit` handles the actual submission logic
    await onSubmit(values, attachments); 
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    form.reset();
    setIsSubmitting(false);
  }


  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser.");
        return;
    }

    setIsFetchingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            form.setValue('incidentLocation', `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
            setIsFetchingLocation(false);
        },
        (error) => {
            setLocationError(`Error fetching location: ${error.message}`);
            setIsFetchingLocation(false);
        }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Branch & Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch / Store Location</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Main Branch">Main Branch</SelectItem>
                      <SelectItem value="Downtown Service Center">Downtown Service Center</SelectItem>
                      <SelectItem value="Westside Express">Westside Express</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div />
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2 Wheeler">2 Wheeler</SelectItem>
                      <SelectItem value="3 Wheeler">3 Wheeler</SelectItem>
                      <SelectItem value="4 Wheeler">4 Wheeler</SelectItem>
                      <SelectItem value="Electric Bus">Electric Bus</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Honda Activa, Toyota Camry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MH12AB1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle className="text-xl">Customer Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="customerType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Customer Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select customer type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="B2C">B2C (Individual)</SelectItem>
                                <SelectItem value="B2B">B2B (Business)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactNumber" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle className="text-xl">Complaint Specifics</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="issue" render={({ field }) => (
                        <FormItem><FormLabel>Issue Title</FormLabel><FormControl><Input placeholder="e.g., Engine making strange noises" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField
                        control={form.control}
                        name="issueType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Issue Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select issue type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                                    <SelectItem value="Electrical">Electrical</SelectItem>
                                    <SelectItem value="Bodywork">Bodywork</SelectItem>
                                    <SelectItem value="General Service">General Service</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="resolutionType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Resolution Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select where the service is needed" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="On-site">On-site Assistance</SelectItem>
                                    <SelectItem value="Workshop">Workshop Visit</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Set priority level" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField control={form.control} name="detailedIssue" render={({ field }) => (
                    <FormItem><FormLabel>Detailed Issue Description</FormLabel><FormControl><Textarea placeholder="Describe the issue in detail..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                )} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="incidentLocation" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Incident Location (Optional)</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input placeholder="e.g., Main Street or GPS coordinates" {...field} />
                                </FormControl>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={handleFetchLocation}
                                    disabled={isFetchingLocation}
                                >
                                    {isFetchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                </Button>
                            </div>
                            {locationError && <p className="text-sm text-destructive">{locationError}</p>}
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField
                        control={form.control}
                        name="incidentDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Date of Incident (Optional)</FormLabel>
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
                                    disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                 </div>
                 <FormItem>
                    <FormLabel>Attach Documents or Images</FormLabel>
                    <FormControl>
                        <Input type="file" multiple onChange={(e) => setAttachments(e.target.files)} />
                    </FormControl>
                    <FormDescription>
                        You can upload multiple files (e.g., photos of damage, previous receipts).
                    </FormDescription>
                </FormItem>
            </CardContent>
        </Card>
        
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Ticket
        </Button>
      </form>
    </Form>
  );
}
