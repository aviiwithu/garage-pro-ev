
'use client';

import { Transaction } from '@/lib/accounting-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useComplaint } from '@/context/ComplaintContext';
import { Invoice } from '@/lib/invoice-data';
import { Button } from '../ui/button';

interface TransactionsTableProps {
    transactions: Transaction[];
    onViewInvoice: (invoice: Invoice) => void;
}

export function TransactionsTable({ transactions, onViewInvoice }: TransactionsTableProps) {
    const { invoices } = useComplaint();
    
    const getVariant = (type: Transaction['type']) => {
        switch (type) {
            case 'Revenue': return 'bg-green-500 hover:bg-green-500/90';
            case 'Expense': return 'bg-red-500 hover:bg-red-500/90';
            case 'Invoice Created': return 'bg-yellow-500 hover:bg-yellow-500/90 text-black';
            default: return 'bg-gray-500 hover:bg-gray-500/90';
        }
    }

    const handleDescriptionClick = (transaction: Transaction) => {
        if (transaction.relatedInvoiceId) {
            const invoice = invoices.find(inv => inv.id === transaction.relatedInvoiceId);
            if (invoice) {
                onViewInvoice(invoice);
            }
        }
    };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{format(new Date(transaction.date), 'PPP')}</TableCell>
            <TableCell><Badge className={getVariant(transaction.type)}>{transaction.type}</Badge></TableCell>
            <TableCell className="font-medium">
                {transaction.relatedInvoiceId ? (
                    <Button 
                        variant="link" 
                        className="p-0 h-auto text-left" 
                        onClick={() => handleDescriptionClick(transaction)}
                    >
                        {transaction.description}
                    </Button>
                ) : (
                    transaction.description
                )}
            </TableCell>
            <TableCell 
                className={cn(
                    'text-right',
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                )}
            >
                <span className="font-code">{transaction.amount > 0 ? `+INR ` : `-INR `}</span>
                <span className="font-code">₹</span><span className="font-code">{Math.abs(transaction.amount).toFixed(2)}</span>
            </TableCell>
          </TableRow>
        ))}
        {transactions.length === 0 && (
            <TableRow>
                <TableCell colSpan={4} className="text-center">No transactions recorded yet.</TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
