
'use client';

import { useMemo } from 'react';
import { useAccounting } from '@/context/AccountingContext';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ReportRow = ({ label, amount, isTotal = false, isSubItem = false, isFinal = false }: { label: string, amount: number, isTotal?: boolean, isSubItem?: boolean, isFinal?: boolean }) => (
    <TableRow className={isFinal ? "border-t-2 border-primary" : ""}>
        <TableCell className={`font-medium ${isTotal ? 'font-bold' : ''} ${isSubItem ? 'pl-8' : ''}`}>{label}</TableCell>
        <TableCell className={`text-right ${isTotal ? 'font-bold' : ''}`}>
            <span className="font-sans">₹</span><span className="font-code">{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </TableCell>
    </TableRow>
);

export function ProfitAndLossStatement() {
    const { transactions, expenses, loading } = useAccounting();

    const reportData = useMemo(() => {
        const operatingIncome = transactions.filter(t => t.type === 'Revenue').reduce((sum, t) => sum + t.amount, 0);

        // For now, COGS is based on 'Parts Purchase' expenses, as we don't have a full COGS account.
        const cogsExpenses = expenses.filter(e => e.category === 'Parts Purchase');
        const cogs = cogsExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        const grossProfit = operatingIncome - cogs;

        const operatingExpensesList = expenses.filter(e => e.category !== 'Parts Purchase');
        const operatingExpenseTotal = operatingExpensesList.reduce((sum, e) => sum + e.amount, 0);
        
        const operatingProfit = grossProfit - operatingExpenseTotal;
        const netProfitLoss = operatingProfit; // Assuming no non-operating items for now

        const groupedExpenses = operatingExpensesList.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        return {
            operatingIncome,
            cogs,
            grossProfit,
            groupedExpenses,
            operatingExpenseTotal,
            operatingProfit,
            netProfitLoss,
        };
    }, [transactions, expenses]);

    if (loading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-4 space-y-4">
            <div className="text-center">
                <p className="text-muted-foreground">Basis: Accrual</p>
                <p className="text-muted-foreground">From {format(new Date().setFullYear(new Date().getFullYear(), 3, 1), 'dd/MM/yyyy')} To {format(new Date().setFullYear(new Date().getFullYear() + 1, 2, 31), 'dd/MM/yyyy')}</p>
            </div>
            <Table>
                <TableBody>
                    <ReportRow label="Operating Income" amount={reportData.operatingIncome} isTotal />
                    <ReportRow label="Sales" amount={reportData.operatingIncome} isSubItem />

                    <ReportRow label="Cost of Goods Sold" amount={reportData.cogs} isTotal />
                    <ReportRow label="Parts Purchases" amount={reportData.cogs} isSubItem />
                    
                    <ReportRow label="Gross Profit" amount={reportData.grossProfit} isTotal />

                    <ReportRow label="Operating Expense" amount={reportData.operatingExpenseTotal} isTotal />
                    {Object.entries(reportData.groupedExpenses).map(([category, amount]) => (
                        <ReportRow key={category} label={category} amount={amount} isSubItem />
                    ))}
                    
                    <ReportRow label="Operating Profit" amount={reportData.operatingProfit} isTotal />
                    
                    {/* Placeholders for future implementation */}
                    <ReportRow label="Non Operating Income" amount={0.00} isTotal />
                    <ReportRow label="Non Operating Expense" amount={0.00} isTotal />

                    <ReportRow label="Net Profit/Loss" amount={reportData.netProfitLoss} isFinal isTotal />
                </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground text-center">Amount is displayed in your base currency INR</p>
        </div>
    );
}
