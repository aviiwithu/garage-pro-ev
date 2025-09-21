
export type ExpenseCategory = 'Parts Purchase' | 'Rent' | 'Utilities' | 'Salaries' | 'Marketing' | 'Other';

export type Expense = {
    id: string;
    date: string; // ISO Date String
    category: ExpenseCategory;
    description: string;
    amount: number;
};

export type TransactionType = 'Revenue' | 'Expense' | 'Invoice Created';

export type Transaction = {
    id: string;
    date: string; // ISO Date String
    type: TransactionType;
    description: string;
    amount: number;
    relatedInvoiceId?: string;
    relatedExpenseId?: string;
    relatedTicketId?: string;
};
