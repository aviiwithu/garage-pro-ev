
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Download, Loader2, PlusCircle } from 'lucide-react';
import { useVendor } from '@/context/VendorContext';
import { ContractManager } from '@/components/vendors/contract-manager';

export default function VendorContractsPage() {
    const { contracts, loading } = useVendor();
    
    const handleDownload = () => alert("Download functionality not yet implemented.");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Contract Management"
        description="Oversee all vendor contracts and agreements."
      >
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2" />
            Download Report
        </Button>
        <Button>
            <PlusCircle className="mr-2" />
            Add Contract
        </Button>
      </PageHeader>
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ContractManager contracts={contracts} />
      )}
    </div>
  );
}
