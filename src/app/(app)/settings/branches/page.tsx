
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AddBranchForm } from '@/components/settings/add-branch-form';

// Mock data for now, this would come from a context or API call
const branches = [
    { id: '1', name: 'Main Branch', location: 'Downtown, Mechville', manager: 'John Doe', contact: '555-1234', status: 'Active' },
    { id: '2', name: 'Westside Express', location: 'West Suburbs, Mechville', manager: 'Jane Smith', contact: '555-5678', status: 'Active' },
    { id: '3', name: 'Northpoint Service', location: 'North District, Mechville', manager: 'Jim Brown', contact: '555-9012', status: 'Inactive' },
];


export default function BranchesPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false); // Placeholder for data loading

    const handleFormSuccess = () => {
        setDialogOpen(false);
        // Here you would typically refetch the branches list
    };
    
    const getStatusVariant = (status: string) => status === 'Active' ? 'default' : 'secondary';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Branch Management"
        description="Add, view, and manage all your organization's branches."
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Add New Branch
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Branch</DialogTitle>
                    <DialogDescription>
                        Fill in the details to register a new branch in the system.
                    </DialogDescription>
                </DialogHeader>
                <AddBranchForm onSuccess={handleFormSuccess} />
            </DialogContent>
        </Dialog>

      </PageHeader>
      
      <Card>
        <CardHeader>
            <CardTitle>Branch List</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Branch Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Branch Manager</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.map((branch) => (
                            <TableRow key={branch.id}>
                                <TableCell className="font-medium">{branch.name}</TableCell>
                                <TableCell>{branch.location}</TableCell>
                                <TableCell>{branch.manager}</TableCell>
                                <TableCell>{branch.contact}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(branch.status)}>{branch.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem>Deactivate</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
