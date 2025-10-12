
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useInventory } from '@/context/InventoryContext';
import { Customer } from '@/lib/customer-data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useSales } from '@/context/SalesContext';

const quoteItemSchema = z.object({
  itemId: z.string().min(1, "Item selection is required."),
  itemType: z.enum(['part', 'service']),
  itemName: z.string(),
  hsnSacCode: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  rate: z.coerce.number().min(0, "Rate must be positive."),
  discount: z.coerce.number().min(0).max(100).optional(),
  tax: z.coerce.number().min(0).optional(),
});

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  customerName: z.string(),
  branch: z.string().min(1, "Branch is required."),
  sourceOfSupply: z.string().min(1, "Source of supply is required."),
  quoteNumber: z.string().min(1, "Quote number is required."),
  reference: z.string().optional(),
  quoteDate: z.date(),
  expiryDate: z.date().optional(),
  salesperson: z.string().optional(),
  projectName: z.string().optional(),
  subject: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required."),
  customerNotes: z.string().optional(),
  adjustment: z.coerce.number().optional(),
});

type QuoteFormValues = z.infer<typeof formSchema>;

interface NewQuoteFormProps {
    onSubmit: (data: QuoteFormValues) => void;
}

const LOCAL_STORAGE_KEY = 'newQuoteForm';

export function NewQuoteForm({ onSubmit }: NewQuoteFormProps) {
  const { parts, services } = useInventory();
  const { quotes } = useSales();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const combinedInventory = [
      ...parts.map(p => ({ ...p, type: 'part' as const })),
      ...services.map(s => ({ ...s, type: 'service' as const }))
  ];
  
  const getNextQuoteNumber = () => {
    if (!quotes || quotes.length === 0) return 'QT-00001';
    const lastQuote = quotes.sort((a,b) => a.createdAt > b.createdAt ? -1 : 1)[0];
    if (!lastQuote || !lastQuote.quoteNumber) return 'QT-00001';
    const lastNum = parseInt(lastQuote.quoteNumber.split('-')[1]);
    return `QT-${(lastNum + 1).toString().padStart(5, '0')}`;
  }


  useEffect(() => {
    const customersQuery = query(collection(db, 'users'), where('role', '==', 'customer'));
    const unsubscribe = onSnapshot(customersQuery, (snapshot) => {
        setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });
    return unsubscribe;
  }, []);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      branch: 'Main Branch',
      sourceOfSupply: 'Delhi',
      quoteNumber: getNextQuoteNumber(),
      quoteDate: new Date(),
      items: [],
      customerNotes: 'Looking forward for your business.',
      adjustment: 0,
    },
  });

  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if(parsed.quoteDate) parsed.quoteDate = new Date(parsed.quoteDate);
            if(parsed.expiryDate) parsed.expiryDate = new Date(parsed.expiryDate);
            form.reset(parsed);
        } catch (e) {
            console.error("Failed to parse quote form data from localStorage", e);
        }
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  useEffect(() => {
    form.setValue('quoteNumber', getNextQuoteNumber());
  }, [quotes, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const watchAdjustment = form.watch("adjustment");
  
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        form.setValue('customerId', customerId);
        form.setValue('customerName', customer.name);
    }
  };


  const handleItemChange = (itemId: string, index: number) => {
      const selectedItem = combinedInventory.find(item => item.id === itemId);
      if (selectedItem) {
          form.setValue(`items.${index}.itemType`, selectedItem.type);
          form.setValue(`items.${index}.itemName`, selectedItem.name);
          form.setValue(`items.${index}.hsnSacCode`, selectedItem.hsnSacCode);
          form.setValue(`items.${index}.rate`, selectedItem.price);
          form.setValue(`items.${index}.tax`, selectedItem.gstRate);
          form.setValue(`items.${index}.quantity`, 1);
          form.setValue(`items.${index}.discount`, 0);
      }
  };

  const totals = watchItems.reduce((acc, item) => {
    const itemTotal = (item.quantity || 0) * (item.rate || 0);
    const discountAmount = itemTotal * ((item.discount || 0) / 100);
    const taxableAmount = itemTotal - discountAmount;
    const taxAmount = taxableAmount * ((item.tax || 0) / 100);
    acc.subTotal += taxableAmount;
    acc.totalTax += taxAmount;
    return acc;
  }, { subTotal: 0, totalTax: 0 });

  const grandTotal = totals.subTotal + totals.totalTax + (watchAdjustment || 0);

  function handleFormSubmit(values: QuoteFormValues) {
    onSubmit(values);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    form.reset({
        ...form.getValues(),
        quoteNumber: getNextQuoteNumber(),
        items: [],
        customerNotes: 'Looking forward for your business.',
        adjustment: 0,
    });
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-6">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField control={form.control} name="customerId" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Customer Name</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); handleCustomerChange(value); }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {customers.map(customer => (
                                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Branch" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="sourceOfSupply" render={({ field }) => (
                    <FormItem><FormLabel>Source of Supply</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="quoteNumber" render={({ field }) => (
                    <FormItem><FormLabel>Quote#</FormLabel><FormControl><Input readOnly {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="reference" render={({ field }) => (
                    <FormItem><FormLabel>Reference#</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="quoteDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Quote Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Expiry Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="salesperson" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Salesperson</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="projectName" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Project Name</FormLabel><FormControl><Input placeholder="Select a customer to associate a project." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem className="md:col-span-4"><FormLabel>Subject</FormLabel><FormControl><Textarea placeholder="Let your customer know what this Quote is for" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Item Details</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-4/12">Item Details</TableHead>
                                <TableHead>HSN/SAC</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Discount (%)</TableHead>
                                <TableHead>Tax (%)</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => {
                                const item = watchItems[index];
                                const itemTotal = (item.quantity || 0) * (item.rate || 0);
                                const discountAmount = itemTotal * ((item.discount || 0) / 100);
                                const amount = itemTotal - discountAmount;
                                return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField control={form.control} name={`items.${index}.itemId`} render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={(value) => { field.onChange(value); handleItemChange(value, index); }} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {combinedInventory.map(invItem => (
                                                            <SelectItem key={invItem.id} value={invItem.id!}>{invItem.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            <FormMessage /></FormItem>
                                        )} />
                                    </TableCell>
                                     <TableCell>
                                        <FormField control={form.control} name={`items.${index}.hsnSacCode`} render={({ field }) => (
                                            <FormItem><FormControl><Input readOnly {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </TableCell>
                                    <TableCell>
                                        <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </TableCell>
                                    <TableCell>
                                        <FormField control={form.control} name={`items.${index}.rate`} render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage/>
                                            </FormItem>
                                        )} />
                                    </TableCell>
                                    <TableCell>
                                        <FormField control={form.control} name={`items.${index}.discount`} render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </TableCell>
                                    <TableCell>
                                        <FormField control={form.control} name={`items.${index}.tax`} render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-code">₹{amount.toFixed(2)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ itemId: '', itemType: 'part', itemName: '', hsnSacCode: '', quantity: 1, rate: 0, discount: 0, tax: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Line
                </Button>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                 <FormField control={form.control} name="customerNotes" render={({ field }) => (
                    <FormItem><FormLabel>Customer Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Sub Total</span><span><span className="font-code">₹</span><span className="font-code">{totals.subTotal.toFixed(2)}</span></span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Total Tax</span><span><span className="font-code">₹</span><span className="font-code">{totals.totalTax.toFixed(2)}</span></span></div>
                         <FormField control={form.control} name="adjustment" render={({ field }) => (
                            <FormItem className="flex justify-between items-center"><FormLabel className="text-muted-foreground text-sm">Adjustment</FormLabel><FormControl><Input type="number" className="w-24 h-8" {...field} /></FormControl></FormItem>
                        )} />
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg"><span >Total (₹)</span><span><span className="font-code">₹</span><span className="font-code">{grandTotal.toFixed(2)}</span></span></div>
                    </CardContent>
                </Card>
            </div>
        </div>
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit">Save Quote</Button>
        </div>
      </form>
    </Form>
    </div>
  );
}

    

    