
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { useSales } from '@/context/SalesContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { SalesOrder } from '@/lib/sales-data';

export default function SalesOrdersPage() {
    const { salesOrders, loading } = useSales();

    const getStatusVariant = (status: SalesOrder['status']) => {
        switch (status) {
            case 'Draft': return 'secondary';
            case 'Confirmed': return 'default';
            case 'Invoiced': return 'default';
            case 'Fulfilled': return 'default';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    }
     const getStatusBgColor = (status: SalesOrder['status']) => {
         switch (status) {
            case 'Invoiced': return 'bg-blue-500 hover:bg-blue-500/90';
            case 'Fulfilled': return 'bg-green-500 hover:bg-green-500/90';
            default: return '';
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="Sales Orders"
                description="Manage confirmed customer orders."
            />
            
            <Card>
                <CardHeader>
                    <CardTitle>All Sales Orders</CardTitle>
                    <CardDescription>A list of all confirmed sales orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Sales Order#</TableHead>
                                <TableHead>Customer Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salesOrders.map(so => (
                                <TableRow key={so.id}>
                                    <TableCell>{format(new Date(so.orderDate), 'PPP')}</TableCell>
                                    <TableCell className="font-medium">{so.salesOrderNumber}</TableCell>
                                    <TableCell>{so.customerName}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(so.status)} className={getStatusBgColor(so.status)}>
                                            {so.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-code">₹</span><span className="font-code">{so.total.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon"><MoreVertical /></Button>
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
