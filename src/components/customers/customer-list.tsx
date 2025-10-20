
'use client';

import { useState } from 'react';
import { Customer } from '@/lib/customer-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EditCustomerForm } from './edit-customer-form';
import { DeleteCustomerDialog } from './delete-customer-dialog';

export function CustomerList({ customers }: { customers: Customer[] }) {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingCustomer(null);
    setIsDeleteDialogOpen(false);
    setDeletingCustomer(null);
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.type === 'B2B') {
      return customer.companyName;
    } else {
      return `${customer.name}`;
    }
  };

  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
            <CardDescription>A list of all customers in your system.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map((customer) => (
                <TableRow key={customer.id}>
                    <TableCell className="font-medium">{getCustomerName(customer)}</TableCell>
                    <TableCell>
                    <Badge variant={customer.type === 'B2B' ? 'secondary' : 'default'}>{customer.type}</Badge>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.vehicles.join(', ')}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditClick(customer)}>Edit Customer</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(customer)} className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            {editingCustomer && <EditCustomerForm customer={editingCustomer} onSuccess={handleSuccess} />}
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
