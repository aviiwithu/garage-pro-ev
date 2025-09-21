
'use client';

import { Vendor, VendorStatus } from '@/lib/vendor-data';
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

interface VendorListProps {
    vendors: Vendor[];
}

export function VendorList({ vendors }: VendorListProps) {
    const getStatusVariant = (status: VendorStatus) => {
        switch(status) {
            case 'Active': return 'default';
            case 'Pending Approval': return 'secondary';
            case 'Inactive': return 'destructive';
            default: return 'outline';
        }
    };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Directory</CardTitle>
        <CardDescription>A list of all registered vendors in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell>{vendor.category}</TableCell>
                <TableCell>{vendor.tier}</TableCell>
                <TableCell>
                    <div>{vendor.contact.name}</div>
                    <div className="text-muted-foreground text-sm">{vendor.contact.email}</div>
                </TableCell>
                <TableCell><Badge variant={getStatusVariant(vendor.status)}>{vendor.status}</Badge></TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {vendors.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No vendors found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
