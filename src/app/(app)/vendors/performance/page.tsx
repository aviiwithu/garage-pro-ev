
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useVendor } from '@/context/VendorContext';
import { PerformanceTracker } from '@/components/vendors/performance-tracker';

export default function VendorPerformancePage() {
    const { performanceRecords, vendors, loading } = useVendor();
    
    // In a real app, you would have a download handler here using Papa.unparse
    const handleDownload = () => alert("Download functionality not yet implemented.");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Supplier Performance"
        description="Track and evaluate vendor performance with data-driven scorecards."
      >
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2" />
            Download Reports
        </Button>
      </PageHeader>
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <PerformanceTracker performanceRecords={performanceRecords} vendors={vendors} />
      )}
    </div>
  );
}
