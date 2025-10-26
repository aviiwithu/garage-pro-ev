"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { LocationPicker } from "./location-picker";
import { PhoneInput } from "../ui/phone-input";
import { useAuth } from '@/context/AuthProvider';
import { Branch } from '@/lib/branch-data';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  // Branch Info
  branch: z.string().min(1, "Branch is required."),

  // Vehicle Information
  vehicleType: z.string().min(1, "Vehicle type is required."),
  vehicleModel: z.string(),
  registrationNumber: z
    .string()
    .min(5, "Valid registration number is required."),

  // Customer Details
  customerType: z.string().min(1, "Customer type is required."),
  customerName: z.string().min(2, "Name is required."),
  phone: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "A valid 10-digit Indian contact number is required."
    ),
  email: z.string().email("A valid email is required."),

  // Complaint Specifics
  issue: z.string().min(5, "Issue title is too short."),
  issueType: z.string().min(1, "Issue type is required."),
  resolutionType: z.string().min(1, "Resolution type is required."),
  priority: z.string().min(1, "Priority level is required."),
  detailedIssue: z
    .string()
    .min(10, "Please describe the issue in more detail."),
  incidentLocation: z.string().optional(),
});

type ComplaintFormValues = z.infer<typeof formSchema>;

interface ComplaintFormProps {
  onSubmit: (data: ComplaintFormValues, attachments: FileList | null) => void;
}

const LOCAL_STORAGE_KEY = "complaintForm";

export function ComplaintForm({ onSubmit }: ComplaintFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const { user, role } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);


  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branch: "",
      vehicleType: "4 Wheeler",
      vehicleModel: "",
      registrationNumber: "",
      customerType: "B2C",
      customerName: "",
      phone: "",
      email: "",
      issue: "",
      issueType: "General Service",
      resolutionType: "Workshop",
      priority: "Medium",
      detailedIssue: "",
      incidentLocation: "",
    },
  });
 useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch('/api/branches');
        const data = await response.json();
        setBranches(data);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      }
    }
    fetchBranches();
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      } catch (e) {
        console.error(
          "Failed to parse complaint form data from localStorage",
          e
        );
      }
    }
  }, [form]);

  useEffect(() => {
    if (user) {
      form.setValue('customerName', user.name || '');
      form.setValue('email', user.email || '');
      if ('mobile' in user && user.mobile) {
        form.setValue('phone', user.phone);
      }
    }
  }, [user, form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function handleFormSubmit(values: ComplaintFormValues) {
    setIsSubmitting(true);
    await onSubmit(values, attachments);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    form.reset();
    setIsSubmitting(false);
  }

  const showVehicleDropdown = role === 'customer' && user && 'vehicles' in user && Array.isArray(user.vehicles) && user.vehicles.length > 0;

  console.log(form.getValues());

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Branch & Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch / Store Location</FormLabel>
                  <Popover >
                    <PopoverTrigger asChild>
                      <FormControl >
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value? branches?.find((branch) => branch.branchCode === field.value)?.name
                            : "Select branch"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search branch..." />
                        <CommandList>
                          <CommandEmpty>No branch found.</CommandEmpty>
                          <CommandGroup>
                            {branches.map((branch) => (
                              <CommandItem
                                value={`${branch.branchCode} ${branch.name} ${branch.location}`}
                                key={branch.branchCode}
                                onSelect={() => {
                                  form.setValue("branch", branch.branchCode)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    branch.branchCode === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {branch.name} - {branch.location}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
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
                    <Input
                      placeholder="e.g., Honda Activa, Toyota Camry"
                      {...field}
                    />
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
                  {/* {showVehicleDropdown ? (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a registered vehicle" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {(user?.vehicles as string[]).map(vehicle => (
                                <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  ) : (
                  )} */}
                  <FormControl>
                    <Input placeholder="e.g., MH12AB1234" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="B2C">B2C (Individual)</SelectItem>
                      <SelectItem value="B2B">B2B (Business)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      type="text"
                      placeholder="98765 43210"
                      className="pl-16"
                      maxLength={10}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
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
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Complaint Specifics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="issue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Engine making strange noises"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Bodywork">Bodywork</SelectItem>
                        <SelectItem value="General Service">
                          General Service
                        </SelectItem>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select where the service is needed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="On-site">
                          On-site Assistance
                        </SelectItem>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Set priority level" />
                        </SelectTrigger>
                      </FormControl>
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
            <FormField
              control={form.control}
              name="detailedIssue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Issue Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1">
              <FormField
                control={form.control}
                name="incidentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Location</FormLabel>
                    <FormControl>
                      <LocationPicker
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormItem>
              <FormLabel>Attach Documents or Images</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setAttachments(e.target.files)}
                />
              </FormControl>
              <FormDescription>
                You can upload multiple files (e.g., photos of damage, previous
                receipts).
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
