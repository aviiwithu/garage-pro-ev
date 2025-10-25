
'use client';

import { useState } from 'react';
import { Customer } from '@/lib/customer-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { EditCustomerForm } from './edit-customer-form';
import { DeleteCustomerDialog } from './delete-customer-dialog';
import { CustomerDetails } from './customer-details';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from '@/components/ui/input';
import { columns } from './columns';


export function CustomerList({ customers }: { customers: Customer[] }) {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      viewCustomer: (customer: Customer) => {
        setViewingCustomer(customer);
        setIsViewDialogOpen(true);
      },
      editCustomer: (customer: Customer) => {
        setEditingCustomer(customer);
        setIsEditDialogOpen(true);
      },
      deleteCustomer: (customer: Customer) => {
        setDeletingCustomer(customer);
        setIsDeleteDialogOpen(true);
      },
    },
  });

  const handleSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingCustomer(null);
    setIsDeleteDialogOpen(false);
    setDeletingCustomer(null);
  };

  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
            <CardDescription>A list of all customers in your system.</CardDescription>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Search by name..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        return (
                        <TableHead key={header.id}>
                            {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                                )}
                        </TableHead>
                        )
                    })}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                    <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                    >
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                        ))}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                >
                Previous
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                >
                Next
                </Button>
            </div>
        </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogDescription>Update the details for {editingCustomer?.displayName}.</DialogDescription>
            </DialogHeader>
            {editingCustomer && <EditCustomerForm customer={editingCustomer} onSuccess={handleSuccess} />}
            </DialogContent>
        </Dialog>
        
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {viewingCustomer && <CustomerDetails customer={viewingCustomer} />}
            </DialogContent>
        </Dialog>

        <DeleteCustomerDialog 
            customer={deletingCustomer}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={handleSuccess}
        />
    </>
  );
}
