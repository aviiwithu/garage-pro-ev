
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useVendor } from '@/context/VendorContext';
import { VendorList } from '@/components/vendors/vendor-list';
import { AddVendorForm } from '@/components/vendors/add-vendor-form';
import Papa from 'papaparse';
import { format } from 'date-fns';

export default function VendorManagementPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { vendors, loading } = useVendor();

    const handleDownload = () => {
        if (vendors.length === 0) {
            alert("No data available to download.");
            return;
        }

        const dataToExport = vendors.map(v => ({
            id: v.id,
            name: v.name,
            category: v.category,
            tier: v.tier,
            status: v.status,
            contactName: v.contact.name,
            contactEmail: v.contact.email,
            contactPhone: v.contact.phone,
            address: v.address,
            gstNumber: v.gstNumber,
            createdAt: v.createdAt,
        }));
        
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `vendors-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Vendor Directory"
        description="Manage all suppliers, service providers, and partners."
      >
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2" />
            Download CSV
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Add Vendor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Onboard New Vendor</DialogTitle>
                    <DialogDescription>
                        Fill in the details to add a new vendor to the system.
                    </DialogDescription>
                </DialogHeader>
                <AddVendorForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
        </Dialog>

      </PageHeader>
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <VendorList vendors={vendors} />
      )}
    </div>
  );
}
