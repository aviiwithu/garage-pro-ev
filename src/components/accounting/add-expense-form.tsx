
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Expense } from '@/lib/accounting-data';
import { useEffect } from 'react';

const formSchema = z.object({
  category: z.enum(['Parts Purchase', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Other']),
  description: z.string().min(3, { message: 'Description is required.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
});

interface AddExpenseFormProps {
    onSuccess: () => void;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'addExpenseForm';

export function AddExpenseForm({ onSuccess, addExpense }: AddExpenseFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'Other',
      description: '',
      amount: 0,
    },
  });

  useEffect(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if(parsed.amount) parsed.amount = Number(parsed.amount || 0);
            form.reset(parsed);
        }
    } catch (e) {
        console.error("Failed to parse expense form data from localStorage", e);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
        } catch (e) {
            console.error("Failed to save expense form data to localStorage", e);
        }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const expenseData = {
        ...values,
        date: new Date().toISOString(),
    };
    
    await addExpense(expenseData);

    toast({
        title: "Expense Added",
        description: `An expense of ${values.amount} for ${values.category} has been recorded.`,
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Parts Purchase">Parts Purchase</SelectItem>
                        <SelectItem value="Rent">Rent</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Salaries">Salaries</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Monthly electricity bill" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Add Expense</Button>
      </form>
    </Form>
  );
}
