
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2 } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { useState, useMemo } from 'react';
import { InventoryPart } from '@/lib/inventory-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type IndentItem = InventoryPart & { reorderQty: number };

export default function PurchasesPage() {
    const { parts, loading: inventoryLoading } = useInventory();
    const [indentItems, setIndentItems] = useState<IndentItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [indentGenerated, setIndentGenerated] = useState(false);
    const { toast } = useToast();

    const lowStockItems = useMemo(() => {
        return parts.filter(p => p.stock <= p.minStockLevel);
    }, [parts]);

    const handleGenerateIndent = () => {
        setIsGenerating(true);
        const itemsToIndent = lowStockItems.map(item => ({
            ...item,
            reorderQty: Math.max(10, item.minStockLevel * 2 - item.stock), // Default reorder logic
        }));
        setIndentItems(itemsToIndent);
        setIsGenerating(false);
        setIndentGenerated(true);
    };

    const handleQuantityChange = (partNumber: string, newQty: number) => {
        setIndentItems(prevItems =>
            prevItems.map(item =>
                item.partNumber === partNumber ? { ...item, reorderQty: newQty } : item
            )
        );
    };

    const handleSubmitIndent = () => {
        // In a real application, this would create a Purchase Order document in Firestore.
        console.log("Submitting indent:", indentItems);
        toast({
            title: "Indent Submitted",
            description: `A purchase indent for ${indentItems.length} items has been created.`,
        });
        setIndentGenerated(false);
        setIndentItems([]);
    };

    const totalIndentValue = useMemo(() => {
        return indentItems.reduce((total, item) => total + (item.price * item.reorderQty), 0);
    }, [indentItems]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="Purchases & Indents"
                description="Manage purchase orders and create indents for low-stock items."
            />
            
            {!indentGenerated ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Purchase Indent</CardTitle>
                        <CardDescription>
                            Automatically generate a purchase indent for items that are running low on stock.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {inventoryLoading ? (
                             <div className="flex justify-center items-center h-24">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-start gap-4">
                                <p>
                                    Found <span className="font-bold text-primary">{lowStockItems.length}</span> items at or below minimum stock level.
                                </p>
                                <Button onClick={handleGenerateIndent} disabled={isGenerating || lowStockItems.length === 0}>
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
                                    Generate Indent
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>New Purchase Indent</CardTitle>
                        <CardDescription>Review the items and quantities before submitting the indent.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Part Name</TableHead>
                                    <TableHead>Part Number</TableHead>
                                    <TableHead>Current Stock</TableHead>
                                    <TableHead>Min. Stock</TableHead>
                                    <TableHead>Reorder Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {indentItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.partNumber}</TableCell>
                                        <TableCell>{item.stock}</TableCell>
                                        <TableCell>{item.minStockLevel}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={item.reorderQty}
                                                onChange={(e) => handleQuantityChange(item.partNumber, parseInt(e.target.value) || 0)}
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-sans">₹</span><span className="font-code">{item.price.toFixed(2)}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-sans">₹</span><span className="font-code">{(item.price * item.reorderQty).toFixed(2)}</span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-end mt-6">
                           <div className="w-full max-w-sm space-y-4">
                               <div className="flex justify-between font-semibold">
                                   <span>Total Indent Value</span>
                                   <span>
                                       <span className="font-sans">₹</span><span className="font-code">{totalIndentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                   </span>
                               </div>
                               <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setIndentGenerated(false)}>Cancel</Button>
                                    <Button onClick={handleSubmitIndent}>Submit Indent</Button>
                               </div>
                           </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Purchase History</CardTitle>
                    <CardDescription>A log of all past purchase indents and orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Purchase history will be displayed here.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
