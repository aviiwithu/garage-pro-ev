
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { NewQuoteForm } from '@/components/sales/new-quote-form';
import { useSales } from '@/context/SalesContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, ChevronsRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useState } from 'react';
import { format } from 'date-fns';
import { Quote } from '@/lib/sales-data';

export default function QuotesPage() {
    const { quotes, addQuote, updateQuoteStatus, convertToSalesOrder } = useSales();
    const { toast } = useToast();
    const router = useRouter();
    const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);

    const handleFormSubmit = (data: any) => {
        addQuote(data);
        toast({
            title: "Quote Created",
            description: `Quote ${data.quoteNumber} has been saved as a draft.`,
        });
        setIsNewQuoteOpen(false);
    }

    const handleConvertToSO = (quoteId: string) => {
        convertToSalesOrder(quoteId);
        toast({
            title: "Quote Converted",
            description: "A new sales order has been created.",
        });
        router.push('/sales/sales-orders');
    }
    
    const getStatusVariant = (status: Quote['status']) => {
        switch (status) {
            case 'Draft': return 'secondary';
            case 'Sent': return 'default';
            case 'Accepted': return 'default';
            case 'Rejected': return 'destructive';
            case 'Converted': return 'default';
            default: return 'outline';
        }
    }
    
    const getStatusBgColor = (status: Quote['status']) => {
         switch (status) {
            case 'Accepted': return 'bg-green-500 hover:bg-green-500/90';
            case 'Converted': return 'bg-blue-500 hover:bg-blue-500/90';
            default: return '';
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="Quotes"
                description="Create and manage sales quotations."
            >
                 <Dialog open={isNewQuoteOpen} onOpenChange={setIsNewQuoteOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2"/>
                            New Quote
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>Create New Quote</DialogTitle>
                        </DialogHeader>
                        <NewQuoteForm onSubmit={handleFormSubmit} />
                    </DialogContent>
                </Dialog>
            </PageHeader>
            
            <Card>
                <CardHeader>
                    <CardTitle>All Quotes</CardTitle>
                    <CardDescription>A list of all sales quotations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Quote#</TableHead>
                                <TableHead>Customer Name</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotes.map(quote => (
                                <TableRow key={quote.id}>
                                    <TableCell>{format(new Date(quote.quoteDate), 'PPP')}</TableCell>
                                    <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                                    <TableCell>{quote.customerName}</TableCell>
                                    <TableCell>{(quote as any).branch || 'Main'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(quote.status)} className={getStatusBgColor(quote.status)}>
                                            {quote.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-code">₹{quote.total.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                {quote.status === 'Draft' && <DropdownMenuItem onClick={() => updateQuoteStatus(quote.id!, 'Sent')}>Mark as Sent</DropdownMenuItem>}
                                                {quote.status === 'Sent' && <DropdownMenuItem onClick={() => updateQuoteStatus(quote.id!, 'Accepted')}>Mark as Accepted</DropdownMenuItem>}
                                                {quote.status === 'Sent' && <DropdownMenuItem onClick={() => updateQuoteStatus(quote.id!, 'Rejected')}>Mark as Rejected</DropdownMenuItem>}
                                                {quote.status === 'Accepted' && (
                                                    <DropdownMenuItem onClick={() => handleConvertToSO(quote.id!)}>
                                                        <ChevronsRight className="mr-2 h-4 w-4" />
                                                        Convert to Sales Order
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
