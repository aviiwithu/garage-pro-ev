
'use client';

import { AMC } from '@/lib/amc-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from 'react';
import { AmcDetails } from './amc-details';

interface AmcListProps {
  amcs: AMC[];
  updateAmcStatus: (id: string, status: 'Active' | 'Expired' | 'Cancelled') => Promise<void>;
}

export function AmcList({ amcs, updateAmcStatus }: AmcListProps) {
  const [selectedAmc, setSelectedAmc] = useState<AMC | null>(null);

  const getStatusVariant = (status: AMC['status']) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Expired': return 'secondary';
        case 'Cancelled': return 'destructive';
        default: return 'outline';
    }
  }

  return (
    <Dialog>
    <Card>
      <CardHeader>
        <CardTitle>AMC Subscriptions</CardTitle>
        <CardDescription>A list of all customer AMC subscriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle No.</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {amcs.map((amc) => (
              <TableRow key={amc.id}>
                <TableCell className="font-medium">{amc.customerName}</TableCell>
                <TableCell>{amc.vehicleNumber}</TableCell>
                <TableCell>{amc.planName}</TableCell>
                <TableCell>{format(new Date(amc.startDate), 'PPP')}</TableCell>
                <TableCell>{format(new Date(amc.endDate), 'PPP')}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(amc.status)}>{amc.status}</Badge>
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DialogTrigger asChild>
                                <DropdownMenuItem onClick={() => setSelectedAmc(amc)}>
                                    View Details
                                </DropdownMenuItem>
                            </DialogTrigger>
                             {amc.status === 'Active' && (
                                <DropdownMenuItem onClick={() => updateAmcStatus(amc.id!, 'Cancelled')}>
                                    Cancel AMC
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {amcs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No AMCs found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    {selectedAmc && (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>AMC Details - {selectedAmc.id}</DialogTitle>
            </DialogHeader>
            <AmcDetails amc={selectedAmc} />
        </DialogContent>
    )}
    </Dialog>
  );
}
