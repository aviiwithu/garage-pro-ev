
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useComplaint } from '@/context/ComplaintContext';
import { Complaint, ComplaintStatus } from '@/lib/complaint-data';
import { useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { ComplaintsDataTable } from '@/components/complaint-dashboard/complaints-data-table';
import { columns } from '@/components/complaint-dashboard/columns';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import { format, subWeeks, isWithinInterval } from 'date-fns';
import { JobCard } from '@/components/complaint-dashboard/job-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function ComplaintDashboardPage() {
  const { complaints, loading } = useComplaint();
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'Resolved This Week' | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const kpiData = useMemo(() => {
    const oneWeekAgo = subWeeks(new Date(), 1);
    const statusCounts = complaints.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        if ((c.status === 'Resolved' || c.status === 'Closed') && c.resolvedAt && isWithinInterval(new Date(c.resolvedAt), { start: oneWeekAgo, end: new Date() })) {
            acc['Resolved This Week'] = (acc['Resolved This Week'] || 0) + 1;
        }
        return acc;
    }, {} as Record<ComplaintStatus | 'Resolved This Week', number>);

    return {
        open: statusCounts['Open'] || 0,
        inProgress: statusCounts['In Progress'] || 0,
        awaitingApproval: statusCounts['Estimate Shared'] || 0,
        resolvedThisWeek: statusCounts['Resolved This Week'] || 0,
    }
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    if (!statusFilter) return complaints;
    if (statusFilter === 'Resolved This Week') {
        const oneWeekAgo = subWeeks(new Date(), 1);
        return complaints.filter(c => 
            (c.status === 'Resolved' || c.status === 'Closed') && 
            c.resolvedAt && 
            isWithinInterval(new Date(c.resolvedAt), { start: oneWeekAgo, end: new Date() })
        );
    }
    return complaints.filter(c => c.status === statusFilter);
  }, [complaints, statusFilter]);
  
  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };
  
  const handleCloseDialog = () => {
    setSelectedComplaint(null);
  };

  const handleDownload = () => {
    const dataToExport = filteredComplaints.map(c => {
        const { estimatedItems, actualItems, statusHistory, ...rest } = c;
        return {
            ...rest,
            estimatedParts: estimatedItems.parts.map(p => p.name).join(', '),
            estimatedServices: estimatedItems.services.map(s => s.name).join(', '),
            actualParts: actualItems.parts.map(p => p.name).join(', '),
            actualServices: actualItems.services.map(s => s.name).join(', '),
            statusHistory: statusHistory.map(h => `${h.status} at ${h.timestamp}`).join(' | '),
        }
    });
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `complaints-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Complaint Dashboard"
        description="Monitor, manage, filter, and sort all service tickets."
      >
        {statusFilter && (
            <Button variant="ghost" onClick={() => setStatusFilter(null)}>Clear Filter: {statusFilter}</Button>
        )}
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2" />
            Download CSV
        </Button>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card onClick={() => setStatusFilter('Open')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader><CardTitle>Open Tickets</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{kpiData.open}</p></CardContent>
        </Card>
        <Card onClick={() => setStatusFilter('Estimate Shared')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader><CardTitle>Awaiting Approval</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{kpiData.awaitingApproval}</p></CardContent>
        </Card>
        <Card onClick={() => setStatusFilter('In Progress')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader><CardTitle>Work In Progress</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{kpiData.inProgress}</p></CardContent>
        </Card>
        <Card onClick={() => setStatusFilter('Resolved This Week')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader><CardTitle>Resolved This Week</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{kpiData.resolvedThisWeek}</p></CardContent>
        </Card>
      </div>
        {loading ? (
             <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <ComplaintsDataTable columns={columns} data={filteredComplaints} onRowClick={handleRowClick} />
        )}

        <Dialog modal={false} open={!!selectedComplaint} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Job Card / Service Ticket</DialogTitle>
                    <DialogDescription>
                        Manage all aspects of the service ticket from assignment to resolution.
                    </DialogDescription>
                </DialogHeader>
                {selectedComplaint && <JobCard complaint={selectedComplaint} />}
            </DialogContent>
        </Dialog>
    </div>
  );
}
