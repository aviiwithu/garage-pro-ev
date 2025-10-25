
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '../ui/textarea';
import { InventoryPart } from '@/lib/inventory-data';
import { useInventory } from '@/context/InventoryContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  adjustmentMode: z.enum(['set', 'add', 'remove']),
  quantity: z.coerce.number().min(0, "Quantity must be a positive number."),
  reason: z.string().min(5, "A reason for the adjustment is required."),
}).refine(data => {
    // If removing stock, ensure the quantity to remove is not greater than the current stock.
    if (data.adjustmentMode === 'remove' && data.quantity < 0) {
        // This validation is now handled by min(0), but good to keep if logic changes
        return false;
    }
    return true;
}, {
    message: "Cannot remove more stock than is available.",
    path: ["quantity"],
});


type FormValues = z.infer<typeof formSchema>;

interface AdjustStockDialogProps {
    part: InventoryPart;
    onSuccess: () => void;
}

export function AdjustStockDialog({ part, onSuccess }: AdjustStockDialogProps) {
    const { adjustStock } = useInventory();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            adjustmentMode: 'set',
            quantity: part.stock,
            reason: ''
        },
    });

    const adjustmentMode = form.watch('adjustmentMode');

    async function onSubmit(values: FormValues) {
        setLoading(true);
        try {
            let newQuantity: number;
            if (values.adjustmentMode === 'set') {
                newQuantity = values.quantity;
            } else if (values.adjustmentMode === 'add') {
                newQuantity = part.stock + values.quantity;
            } else { // 'remove'
                if (values.quantity > part.stock) {
                    form.setError("quantity", { type: "manual", message: "Cannot remove more stock than is available." });
                    setLoading(false);
                    return;
                }
                newQuantity = part.stock - values.quantity;
            }

            await adjustStock(part.id!, newQuantity, values.reason, values.adjustmentMode);

            toast({
                title: "Stock Adjusted",
                description: `Stock for ${part.name} has been updated to ${newQuantity}.`
            });
            onSuccess();
        } catch (error: any) {
            toast({
                title: "Adjustment Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }
    
    const getQuantityLabel = () => {
        switch(adjustmentMode) {
            case 'set': return 'New Total Quantity';
            case 'add': return 'Quantity to Add';
            case 'remove': return 'Quantity to Remove';
            default: return 'Quantity';
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <h4 className="font-medium">{part.name}</h4>
                    <p className="text-sm text-muted-foreground">Current Stock: {part.stock}</p>
                </div>

                <FormField
                    control={form.control}
                    name="adjustmentMode"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Adjustment Mode</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        if (value === 'set') {
                                            form.setValue('quantity', part.stock);
                                        } else {
                                            form.setValue('quantity', 0);
                                        }
                                    }}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="set" /></FormControl>
                                        <FormLabel className="font-normal">Set Quantity</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="add" /></FormControl>
                                        <FormLabel className="font-normal">Add Stock</FormLabel>
                                    </FormItem>
                                     <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="remove" /></FormControl>
                                        <FormLabel className="font-normal">Remove Stock</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{getQuantityLabel()}</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Adjustment</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., Initial stock count, damaged goods, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Adjustment
                    </Button>
                </div>
            </form>
        </Form>
    )
}
