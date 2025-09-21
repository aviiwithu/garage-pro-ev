
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, DollarSign, AlertCircle, TrendingUp, TrendingDown, Loader2, Download } from 'lucide-react';
import { useAccounting } from '@/context/AccountingContext';
import { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddExpenseForm } from '@/components/accounting/add-expense-form';
import { ExpensesTable } from '@/components/accounting/expenses-table';
import { TransactionsTable } from '@/components/accounting/transactions-table';
import { Invoice } from '@/lib/invoice-data';
import { JobCard } from '@/components/complaint-dashboard/job-card';
import Papa from 'papaparse';
import { format } from 'date-fns';
import Link from 'next/link';
import { Complaint } from '@/lib/complaint-data';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AccountingPage() {
    const { expenses, transactions, loading, addExpense, markInvoiceAsPaid } = useAccounting();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [complaintsLoading, setComplaintsLoading] = useState(true);
    const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
    const [viewInvoiceDialogOpen, setViewInvoiceDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        setComplaintsLoading(true);
        const complaintsQuery = collection(db, 'complaints');
        const unsubscribe = onSnapshot(complaintsQuery, (snapshot) => {
            setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint)));
            setComplaintsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const kpiData = useMemo(() => {
        const totalRevenue = transactions
            .filter(t => t.type === 'Revenue')
            .reduce((sum, t) => sum + t.amount, 0);

        const outstandingPayments = transactions
            .filter(t => t.type === 'Invoice Created')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        const netProfit = totalRevenue - totalExpenses;

        return {
            totalRevenue,
            outstandingPayments,
            totalExpenses,
            netProfit
        };
    }, [transactions, expenses]);
    
    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setViewInvoiceDialogOpen(true);
    };

    const selectedComplaint = useMemo(() => {
        if (!selectedInvoice) return null;
        return complaints.find(c => c.id === selectedInvoice.ticketId) || null;
    }, [selectedInvoice, complaints]);

    const handleDownload = (data: any[], filename: string) => {
        const dataToParse = Array.isArray(data) ? data : [];
        if (dataToParse.length === 0) {
            alert("No data available to download.");
            return;
        }
        const csv = Papa.unparse(dataToParse);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="Accounting & Billing"
                description="Monitor your garage's financial health."
            >
                <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Add Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Expense</DialogTitle>
                            <DialogDescription>
                                Record a new expense for your business.
                            </DialogDescription>
                        </DialogHeader>
                        <AddExpenseForm onSuccess={() => setAddExpenseDialogOpen(false)} addExpense={addExpense} />
                    </DialogContent>
                </Dialog>
            </PageHeader>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <span className="font-sans">INR </span>
                            <span className="font-sans">₹</span><span className="font-code">{kpiData.totalRevenue.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">From paid invoices</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Payments</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                             <span className="font-sans">INR </span>
                            <span className="font-sans">₹</span><span className="font-code">{kpiData.outstandingPayments.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">From unpaid invoices</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                             <span className="font-sans">INR </span>
                            <span className="font-sans">₹</span><span className="font-code">{kpiData.totalExpenses.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total operational costs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                             <span className="font-sans">INR </span>
                            <span className="font-sans">₹</span><span className="font-code">{kpiData.netProfit.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
                    </CardContent>
                </Card>
             </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-1">
                     <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Recent Expenses</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(expenses, `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <ExpensesTable expenses={expenses} />
                        )}
                    </CardContent>
                </Card>
                 <Card className="md:col-span-1">
                     <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Recent Transactions</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(transactions, `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <TransactionsTable transactions={transactions} onViewInvoice={handleViewInvoice}/>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* View Invoice Dialog */}
            <Dialog open={viewInvoiceDialogOpen} onOpenChange={setViewInvoiceDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Invoice Details</DialogTitle>
                        {selectedComplaint && (
                             <DialogDescription>
                                Generated from Service Ticket: {' '}
                                <Button variant="link" className="p-0 h-auto" asChild>
                                    <Link href="/operations/complaint-dashboard">{selectedComplaint.id}</Link>
                                </Button>
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    {selectedComplaint ? (
                        <JobCard complaint={selectedComplaint} />
                    ) : (
                        <p>Loading invoice details or related complaint not found...</p>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
