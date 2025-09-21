
'use client';

import { Expense } from '@/lib/accounting-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>{format(new Date(expense.date), 'PPP')}</TableCell>
            <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
            <TableCell className="font-medium">{expense.description}</TableCell>
            <TableCell className="text-right">
              <span className="font-sans">INR </span>
              <span className="font-sans">₹</span><span className="font-code">{expense.amount.toFixed(2)}</span>
            </TableCell>
          </TableRow>
        ))}
        {expenses.length === 0 && (
            <TableRow>
                <TableCell colSpan={4} className="text-center">No expenses recorded yet.</TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
