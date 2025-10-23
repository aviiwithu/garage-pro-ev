"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Technician } from "@/lib/technician-data";
import { useEmployee } from "@/context/EmployeeContext";
import { useState, useEffect, useMemo } from "react";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { DatePicker } from "../ui/date-picker"; // Reusable DatePicker
import { PhoneInput } from "../ui/phone-input";

// Constants for select options
const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
const SPECIALIZATION_OPTIONS = [
  "General",
  "Battery",
  "Electrical",
  "Mechanical",
  "Bodywork",
] as const;
const STATUS_OPTIONS = ["Active", "Inactive"] as const;

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const formSchema = z.object({
  employeeId: z.string().min(1, { message: "Employee ID is required." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "A valid email is required for login." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .optional()
    .or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Invalid phone number format."),
  gender: z.enum(GENDER_OPTIONS),
  dateOfBirth: z.string({ required_error: "Date of birth is required." }),
  dateOfJoining: z.string({ required_error: "Date of joining is required." }),
  dateOfLeaving: z.string().optional().nullable(),

  designation: z.string().min(2, { message: "Title/Designation is required." }),
  specialization: z.enum(SPECIALIZATION_OPTIONS),
  location: z.string().min(2, { message: "Location is required." }),

  panNumber: z.string().length(10, { message: "PAN must be 10 characters." }),
  aadhaarNumber: z
    .string()
    .length(12, { message: "Aadhaar must be 12 digits." }),
  residentOfIndia: z.boolean().default(true),

  bankDetails: z.object({
    accountNumber: z
      .string()
      .min(8, { message: "Account number is required." }),
    ifscCode: z.string().length(11, { message: "IFSC must be 11 characters." }),
    bankName: z.string().min(2, { message: "Bank name is required." }),
  }),

  stopSalary: z.boolean().default(false),
  pf: z.boolean().default(true),
  pfStatus: z.enum(STATUS_OPTIONS),
  uan: z.string().optional(),
  esicStatus: z.enum(STATUS_OPTIONS),
  esicIpNumber: z.string().optional(),

  salaryStructure: z.object({
    basic: z.coerce
      .number()
      .positive({ message: "Basic salary must be positive." }),
    hra: z.coerce.number().min(0, { message: "HRA cannot be negative." }),
    allowances: z
      .array(
        z.object({
          name: z.string().min(2, { message: "Allowance name is required." }),
          amount: z.coerce
            .number()
            .min(0, { message: "Amount must be positive." }),
        })
      )
      .optional(),
    deductions: z
      .array(
        z.object({
          name: z.string().min(2, { message: "Deduction name is required." }),
          amount: z.coerce
            .number()
            .min(0, { message: "Amount must be positive." }),
        })
      )
      .optional(),
  }),
});

const formSchemaWithPassword = formSchema.extend({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

const defaultFormValues = {
  employeeId: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "Male" as const,
  dateOfBirth: "",
  dateOfJoining: new Date().toISOString(),
  designation: "",
  specialization: "General" as const,
  location: "Main Branch",
  panNumber: "",
  aadhaarNumber: "",
  residentOfIndia: true,
  bankDetails: {
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  },
  stopSalary: false,
  pf: true,
  pfStatus: "Active" as const,
  uan: "",
  esicStatus: "Active" as const,
  esicIpNumber: "",
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

export function AddTechnicianForm({
  onSuccess,
  technician,
}: AddTechnicianFormProps) {
  const { toast } = useToast();
  const { addTechnician, updateTechnician } = useEmployee();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(technician ? formSchema : formSchemaWithPassword),
    defaultValues: useMemo(() => defaultFormValues, []),
  });

  useEffect(() => {
    let timeoutRef:NodeJS.Timeout;
    if (technician) {
      const formData = {
        ...technician,
        password: "", // Don't pre-fill password
        phone: technician.phone || "",
        dateOfBirth: technician.dateOfBirth,
        dateOfJoining: technician.dateOfJoining,
        dateOfLeaving: technician.dateOfLeaving
          ? technician.dateOfLeaving
          : null,
        specialization: technician.specialization || "General",
        salaryStructure: {
        ...technician.salaryStructure,
        allowances: technician.salaryStructure?.allowances || [],
        deductions: technician.salaryStructure?.deductions || [],
      },
      };
      timeoutRef = setTimeout(() => {
      form.reset(formData);
      clearTimeout(timeoutRef)
    }, 0);
      // form.reset(formData);
    } else {
      form.reset(defaultFormValues);
    }
  }, [technician]);

  console.log(technician);
  

  const {
    fields: allowanceFields,
    append: appendAllowance,
    remove: removeAllowance,
  } = useFieldArray({
    control: form.control,
    name: "salaryStructure.allowances",
  });

  const {
    fields: deductionFields,
    append: appendDeduction,
    remove: removeDeduction,
  } = useFieldArray({
    control: form.control,
    name: "salaryStructure.deductions",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const { password, designation, ...technicianData } = values;

      const dataPayload = {
        ...technicianData,
        designation: designation,
        dateOfBirth: values.dateOfBirth,
        dateOfJoining: values.dateOfJoining,
        dateOfLeaving: values.dateOfLeaving || null,
      };

      if (technician) {
        await updateTechnician(technician.id, dataPayload);

        if (password) {
          console.log("Password update requested for:", technician.email); // Mock auth action
        }
      } else {
        // For additions, the context handles the role and ID creation
        await addTechnician(dataPayload, password || "");
      }

      toast({
        title: `Employee ${technician ? "Updated" : "Added"}`,
        description: `${values.name} has been successfully ${
          technician ? "updated" : "added"
        }.`,
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error saving employee:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          `Failed to ${technician ? "update" : "add"} employee.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-h-[70vh] overflow-y-auto pr-4"
      >
        <div>
          <h3 className="text-lg font-medium">Personal & Login Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., EMP001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Alice Johnson" {...field} />
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
                  <FormLabel>Login Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tech@garagepro.com"
                      {...field}
                      disabled={!!technician}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {technician ? "New Password (Optional)" : "Password"}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
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
                  <FormLabel>Phone</FormLabel>
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
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    {...field}
                    onValueChange={(val) => {
                      if (val) field.onChange(val);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    fromYear={1960}
                    toYear={2010}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfJoining"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Joining</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    fromYear={2010}
                    toYear={new Date().getFullYear()}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium">Work Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title / Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Technician" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl>
                      <Select {...field}
                       onValueChange={(val) => {
                      if (val) field.onChange(val);
                    }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select specialization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPECIALIZATION_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Work Location / Branch</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Branch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium">Statutory Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number</FormLabel>
                  <FormControl>
                    <Input placeholder="ABCDE1234F" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhaar Number</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789012" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="residentOfIndia"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-8">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Resident of India</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pf"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-8">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>PF Enabled</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pfStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PF Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name="uan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UAN</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="esicStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ESIC Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
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
              name="esicIpNumber"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>ESIC IP Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="bankDetails.bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankDetails.accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankDetails.ifscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IFSC Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium">Salary Structure</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="salaryStructure.basic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Basic Salary</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salaryStructure.hra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House Rent Allowance (HRA)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormLabel>Allowances</FormLabel>
            {allowanceFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 mt-2">
                <FormField
                  control={form.control}
                  name={`salaryStructure.allowances.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Allowance Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`salaryStructure.allowances.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input type="number" placeholder="Amount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAllowance(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => appendAllowance({ name: "", amount: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Allowance
            </Button>
          </div>

          <div className="mt-4">
            <FormLabel>Deductions</FormLabel>
            {deductionFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 mt-2">
                <FormField
                  control={form.control}
                  name={`salaryStructure.deductions.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Deduction Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`salaryStructure.deductions.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input type="number" placeholder="Amount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDeduction(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => appendDeduction({ name: "", amount: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Deduction
            </Button>
          </div>
          <FormField
            control={form.control}
            name="stopSalary"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 pt-8">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Stop Salary Payment</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {technician ? "Update" : "Add"} Employee
        </Button>
      </form>
    </Form>
  );
}
