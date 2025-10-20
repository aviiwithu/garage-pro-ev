
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ServiceRecord } from '@/lib/service-history-data';
import { useState, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Complaint } from '@/lib/complaint-data';
import { JobCard } from '@/components/complaint-dashboard/job-card';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthProvider';
import { useComplaint } from '@/context/ComplaintContext';
import { format } from 'date-fns';

export default function ServiceHistoryPage() {
    const { role } = useAuth();
    const { complaints: allComplaints, loading: complaintsLoading } = useComplaint();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Complaint[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    const complaintsForView = useMemo(() => {
        if (role === 'customer') {
            return allComplaints; // Already filtered by context
        }
        return results;
    }, [role, allComplaints, results]);

    const handleSearch = async () => {
        if (!searchTerm) return;
        setLoading(true);
        setSearched(true);
        setResults([]);

        const q = query(
            collection(db, 'complaints'),
            where('vehicleNumber', '==', searchTerm.toUpperCase()),
            where('status', 'in', ['Resolved', 'Closed'])
        );
        const querySnapshot = await getDocs(q);

        const foundRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));

        setResults(foundRecords);
        setLoading(false);
    }

    const calculateTotalCost = (complaint: Complaint) => {
        const partsCost = complaint.actualItems?.parts?.reduce((sum, item) => sum + item.price, 0) || 0;
        const servicesCost = complaint.actualItems?.services?.reduce((sum, item) => sum + item.price, 0) || 0;
        const totalTax = (complaint.actualItems?.parts?.reduce((sum, part) => sum + (part.price * (part.gstRate || 0) / 100), 0) || 0) + (complaint.actualItems?.services?.reduce((sum, service) => sum + (service.price * (service.gstRate || 0) / 100), 0) || 0);
        return partsCost + servicesCost + totalTax;
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="Service History"
                description={role === 'customer' ? 'Review all your past and current service records.' : 'Retrieve the complete service history for any vehicle.'}
            />

            {role !== 'customer' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Search Vehicle</CardTitle>
                        <CardDescription>Enter a vehicle registration number to see its history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input
                                type="text"
                                placeholder="e.g., AB-123-CD"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button type="button" onClick={handleSearch} disabled={loading}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching...</> : 'Search'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}


            {(searched || role === 'customer') && (
                <Dialog modal={false} >
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {role === 'customer' ? 'My Service Records' : `Search Results for "${searchTerm}"`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(loading || complaintsLoading) ? (
                                <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : complaintsForView.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Service Performed</TableHead>
                                            <TableHead>Technician</TableHead>
                                            <TableHead>Ticket ID</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {complaintsForView.map((record) => (
                                            <DialogTrigger asChild key={record.id}>
                                                <TableRow className="cursor-pointer" onClick={() => setSelectedComplaint(record)}>
                                                    <TableCell>{format(new Date(record.resolvedAt || record.createdAt), 'PPP')}</TableCell>
                                                    <TableCell>{record.issue}</TableCell>
                                                    <TableCell>{record.assignedTo}</TableCell>
                                                    <TableCell>{record.id}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-code">INR </span>
                                                        <span className="font-code">₹</span><span className="font-code">{calculateTotalCost(record).toFixed(2)}</span>
                                                    </TableCell>
                                                </TableRow>
                                            </DialogTrigger>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground p-4">No service history found for this vehicle.</p>
                            )}
                        </CardContent>
                    </Card>

                    {selectedComplaint && (
                        <DialogContent className="max-w-3xl h-[90vh] flex flex-col" >
                            <DialogHeader>
                                <DialogTitle>Service Details for Ticket {selectedComplaint.id}</DialogTitle>
                            </DialogHeader>
                            <JobCard complaint={selectedComplaint} />
                        </DialogContent>
                    )}
                </Dialog>
            )}
        </div>
    );
}
