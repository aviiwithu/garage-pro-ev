
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle } from 'lucide-react';
import { AMC } from '@/lib/amc-data';
import { AmcList } from '@/components/amc/amc-list';
import { AddAmcForm } from '@/components/amc/add-amc-form';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Bike, Truck, Loader2 } from 'lucide-react';
import { useAmc } from '@/context/AmcContext';
import Papa from 'papaparse';
import { format } from 'date-fns';

export default function AmcPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { addAmc, updateAmcStatus, amcs, loading } = useAmc();
    
    const amcStats = useMemo(() => {
        const stats = amcs.reduce((acc, amc) => {
            if (amc.status === 'Active') {
                const category = amc.vehicleCategory || 'Other';
                acc[category] = (acc[category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        return stats;
    }, [amcs]);
    
    const handleDownload = () => {
        const dataToParse = Array.isArray(amcs) ? amcs : [];
        if (dataToParse.length === 0) {
            alert("No data available to download.");
            return;
        }
        const csv = Papa.unparse(dataToParse);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `amcs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Annual Maintenance Contracts (AMC)"
        description="Manage all active and expired AMCs."
      >
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2" />
            Download CSV
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Add AMC
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Add New AMC</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new contract for a customer.
                    </DialogDescription>
                </DialogHeader>
                <AddAmcForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
        </Dialog>

      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">4-Wheeler AMCs</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{amcStats['4 Wheeler'] || 0}</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">2-Wheeler AMCs</CardTitle>
                <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{amcStats['2 Wheeler'] || 0}</p></CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commercial AMCs</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{amcStats['Commercial'] || 0}</p></CardContent>
        </Card>
      </div>
      
       {loading ? (
             <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <AmcList amcs={amcs} updateAmcStatus={updateAmcStatus} />
        )}
    </div>
  );
}
