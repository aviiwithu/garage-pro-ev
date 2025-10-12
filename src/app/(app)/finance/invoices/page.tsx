
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Download, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccounting } from '@/context/AccountingContext';
import { Invoice } from '@/lib/invoice-data';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useComplaint } from '@/context/ComplaintContext';

export default function InvoicesPage() {
    const { invoices, loading } = useComplaint();
    const { markInvoiceAsPaid } = useAccounting();
    const { toast } = useToast();

    const getStatusColor = (status: 'Paid' | 'Unpaid') => {
        return status === 'Paid' ? 'bg-green-500 hover:bg-green-500/90' : 'bg-red-500 hover:bg-red-500/90';
    }
    
    const handleMarkAsPaid = async (invoice: Invoice) => {
        try {
            await markInvoiceAsPaid(invoice);
            toast({
                title: "Invoice Paid",
                description: `Invoice for ${invoice.vehicleNumber} has been marked as paid.`
            })
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to mark invoice as paid.",
                variant: "destructive"
            })
        }
    }

    const handleDownload = () => {
        const dataToExport = invoices.map(i => ({
            ...i,
            services: Array.isArray(i.services) ? i.services.map(s => s.name).join(', ') : '',
            parts: Array.isArray(i.parts) ? i.parts.map(p => p.name).join(', ') : '',
        }));

        if (dataToExport.length === 0) {
            alert("No data available to download.");
            return;
        }

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Invoices"
        description="View and manage all customer invoices."
      >
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2" />
            Download CSV
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>A record of all invoices for completed services.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Vehicle No.</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.id.substring(0, 8).toUpperCase()}</TableCell>
                                <TableCell>{invoice.customerName}</TableCell>
                                <TableCell>{invoice.vehicleNumber}</TableCell>
                                <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-code">INR </span>
                                    <span className="font-code">₹</span><span className="font-code">{invoice.total.toFixed(2)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            {invoice.status === 'Unpaid' && (
                                                <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                                                    Mark as Paid
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                         {invoices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">No invoices found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
