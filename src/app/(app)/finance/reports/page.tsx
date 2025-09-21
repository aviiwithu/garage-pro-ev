

'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProfitAndLossStatement } from '@/components/finance/profit-and-loss-statement';

const allReports = {
    'Business Overview': [
        { name: 'Profit and Loss', type: 'Profit and Loss' },
        { name: 'Profit and Loss (Schedule III)', type: 'Profit and Loss (Schedule III)' },
        { name: 'Horizontal Profit and Loss', type: 'Horizontal Profit and Loss' },
        { name: 'Cash Flow Statement', type: 'Cash Flow Statement' },
        { name: 'Balance Sheet', type: 'Balance Sheet' },
        { name: 'Horizontal Balance Sheet', type: 'Horizontal Balance Sheet' },
        { name: 'Balance Sheet (Schedule III)', type: 'Balance Sheet (Schedule III)' },
        { name: 'Business Performance Ratios', type: 'Business Performance Ratios' },
        { name: 'Movement of Equity', type: 'Movement of Equity' },
    ],
    'Sales': [
        { name: 'Sales by Customer', type: 'Sales by Customer' },
        { name: 'Sales by Item', type: 'Sales by Item' },
        { name: 'Sales by Sales Person', type: 'Sales by Sales Person' },
        { name: 'Sales Summary', type: 'Sales Summary' },
    ],
    'Inventory': [
        { name: 'Inventory Summary', type: 'Inventory Summary' },
        { name: 'Committed Stock Details', type: 'Committed Stock Details' },
        { name: 'Inventory Valuation Summary', type: 'Inventory Valuation Summary' },
        { name: 'FIFO Cost Lot Tracking', type: 'FIFO Cost Lot Tracking' },
        { name: 'Inventory Aging Summary', type: 'Inventory Aging Summary' },
        { name: 'Product Sales Report', type: 'Product Sales Report' },
        { name: 'Stock Summary Report', type: 'Stock Summary Report' },
        { name: 'ABC Classification', type: 'ABC Classification' },
        { name: 'Inventory Adjustment Details', type: 'Inventory Adjustment Details' },
        { name: 'Inventory Adjustment Summary', type: 'Inventory Adjustment Summary' },
    ],
    'Receivables': [
        { name: 'AR Aging Summary', type: 'AR Aging Summary' },
        { name: 'AR Aging Details', type: 'AR Aging Details' },
        { name: 'Invoice Details', type: 'Invoice Details' },
        { name: 'Retainer Invoice Details', type: 'Retainer Invoice Details' },
        { name: 'Sales Order Details', type: 'Sales Order Details' },
        { name: 'Delivery Challan Details', type: 'Delivery Challan Details' },
        { name: 'Quote Details', type: 'Quote Details' },
        { name: 'Customer Balance Summary', type: 'Customer Balance Summary' },
        { name: 'Receivable Summary', type: 'Receivable Summary' },
        { name: 'Receivable Details', type: 'Receivable Details' },
    ],
    'Payments Received': [
        { name: 'Payments Received', type: 'Payments Received' },
        { name: 'Time to Get Paid', type: 'Time to Get Paid' },
        { name: 'Credit Note Details', type: 'Credit Note Details' },
        { name: 'Refund History', type: 'Refund History' },
    ],
    'Recurring Invoices': [
        { name: 'Recurring Invoice Details', type: 'Recurring Invoice Details' },
    ],
    'Payables': [
        { name: 'Vendor Balance Summary', type: 'Vendor Balance Summary' },
        { name: 'AP Aging Summary', type: 'AP Aging Summary' },
        { name: 'AP Aging Details', type: 'AP Aging Details' },
        { name: 'Bills Details', type: 'Bills Details' },
        { name: 'Vendor Credits Details', type: 'Vendor Credits Details' },
        { name: 'Payments Made', type: 'Payments Made' },
        { name: 'Refund History', type: 'Refund History' },
        { name: 'Purchase Order Details', type: 'Purchase Order Details' },
        { name: 'Purchase Orders by Vendor', type: 'Purchase Orders by Vendor' },
        { name: 'Payable Summary', type: 'Payable Summary' },
        { name: 'Payable Details', type: 'Payable Details' },
    ],
    'Purchases and Expenses': [
        { name: 'Purchases by Vendor', type: 'Purchases by Vendor' },
        { name: 'Purchases by Item', type: 'Purchases by Item' },
        { name: 'Expense Details', type: 'Expense Details' },
        { name: 'Expenses by Category', type: 'Expenses by Category' },
        { name: 'Expenses by Customer', type: 'Expenses by Customer' },
        { name: 'Expenses by Project', type: 'Expenses by Project' },
        { name: 'Expenses by Employee', type: 'Expenses by Employee' },
        { name: 'Billable Expense Details', type: 'Billable Expense Details' },
    ],
    'Taxes': [
        { name: 'Tax Summary', type: 'Tax Summary' },
        { name: 'TCS Summary (Form No. 27EQ)', type: 'TCS Summary (Form No. 27EQ)' },
        { name: 'Invoice Furnishing Facility(IFF)', type: 'Invoice Furnishing Facility(IFF)' },
        { name: 'PMT-06 (Self Assessment Basis)', type: 'PMT-06 (Self Assessment Basis)' },
        { name: 'GSTR-3B Summary', type: 'GSTR-3B Summary' },
        { name: 'Summary of Outward Supplies', type: 'Summary of Outward Supplies' },
        { name: 'Summary of Inward Supplies', type: 'Summary of Inward Supplies' },
        { name: 'Self-invoice Summary', type: 'Self-invoice Summary' },
        { name: 'Annual Summary (GSTR-9)', type: 'Annual Summary (GSTR-9)' },
        { name: 'TDS Summary', type: 'TDS Summary' },
        { name: 'TDS Receivables', type: 'TDS Receivables' },
    ],
    'Banking': [
        { name: 'Reconciliation Status', type: 'Reconciliation Status' },
    ],
    'Projects and Timesheet': [
        { name: 'Timesheet Details', type: 'Timesheet Details' },
        { name: 'Timesheet Profitability Summary', type: 'Timesheet Profitability Summary' },
        { name: 'Project Summary', type: 'Project Summary' },
        { name: 'Project Details', type: 'Project Details' },
        { name: 'Projects Cost Summary', type: 'Projects Cost Summary' },
        { name: 'Projects Revenue Summary', type: 'Projects Revenue Summary' },
        { name: 'Projects Performance Summary', type: 'Projects Performance Summary' },
    ],
    'Accountant': [
        { name: 'Account Transactions', type: 'Account Transactions' },
        { name: 'Account Type Summary', type: 'Account Type Summary' },
        { name: 'Account Type Transactions', type: 'Account Type Transactions' },
        { name: 'Day Book', type: 'Day Book' },
        { name: 'General Ledger', type: 'General Ledger' },
        { name: 'Detailed General Ledger', type: 'Detailed General Ledger' },
        { name: 'Journal Report', type: 'Journal Report' },
        { name: 'Trial Balance', type: 'Trial Balance' },
    ],
    'Currency': [
        { name: 'Realized Gain or Loss', type: 'Realized Gain or Loss' },
        { name: 'Unrealized Gain or Loss', type: 'Unrealized Gain or Loss' },
    ],
    'Activity': [
        { name: 'System Mails', type: 'System Mails' },
        { name: 'SMS Notifications', type: 'SMS Notifications' },
        { name: 'WhatsApp Notifications', type: 'WhatsApp Notifications' },
        { name: 'IM Credits Usage', type: 'IM Credits Usage' },
        { name: 'Activity Logs &amp; Audit Trail', type: 'Activity Logs &amp; Audit Trail' },
        { name: 'Exception Report', type: 'Exception Report' },
        { name: 'Portal Activities', type: 'Portal Activities' },
        { name: 'Customer Reviews', type: 'Customer Reviews' },
        { name: 'API Usage', type: 'API Usage' },
        { name: 'Pending Inventory Valuations', type: 'Pending Inventory Valuations' },
    ],
     'Automation': [
        { name: 'Scheduled Date Based Workflow Rules', type: 'Scheduled Date Based Workflow Rules' },
        { name: 'Scheduled Time Based Workflow Actions', type: 'Scheduled Time Based Workflow Actions' },
        { name: 'Workflow Execution Logs', type: 'Workflow Execution Logs' },
    ],
};

export default function ReportsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="All Reports"
                description="Access payroll, HR, compliance, and tax reports."
            />
            
            <Card>
                <CardHeader>
                    <CardTitle>Reports Dashboard</CardTitle>
                    <CardDescription>Select a category to view available reports.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full">
                        {Object.entries(allReports).map(([category, reports]) => (
                            <AccordionItem value={category} key={category}>
                                <AccordionTrigger className="text-lg font-semibold">
                                    {category} ({reports.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Report Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Created By</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reports.map((report) => {
                                                const isPnL = report.name === 'Profit and Loss';
                                                
                                                if (isPnL) {
                                                    return (
                                                        <TableRow key={report.name}>
                                                            <TableCell className="font-medium">
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="link" className="p-0 h-auto">{report.name}</Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-4xl">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Profit and Loss Statement</DialogTitle>
                                                                        </DialogHeader>
                                                                        <ProfitAndLossStatement />
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </TableCell>
                                                            <TableCell>{report.type}</TableCell>
                                                            <TableCell>System Generated</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }

                                                return (
                                                    <TableRow key={report.name}>
                                                        <TableCell className="font-medium">
                                                            <Link href="#" className="hover:underline text-primary">
                                                                {report.name}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>{report.type}</TableCell>
                                                        <TableCell>System Generated</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
