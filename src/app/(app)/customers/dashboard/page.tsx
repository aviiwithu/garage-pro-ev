
'use client';

import { useAuth } from '@/context/AuthProvider';
import { useComplaint } from '@/context/ComplaintContext';
import { useAmc } from '@/context/AmcContext';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Car, FileText, FileClock, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function CustomerDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const { complaints, loading: complaintsLoading } = useComplaint();
    const { amcs, loading: amcsLoading } = useAmc();

    const loading = authLoading || complaintsLoading || amcsLoading;

    const openTickets = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed');
    const activeAmc = amcs.find(amc => amc.status === 'Active');

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title={`Welcome, ${user?.name || 'Customer'}`}
                description="Here's a quick overview of your account."
            >
                <Button asChild>
                    <Link href="/operations/service-tickets">
                        <PlusCircle className="mr-2" />
                        Create New Ticket
                    </Link>
                </Button>
            </PageHeader>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user?.vehicles?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {Array.isArray(user?.vehicles) ? user.vehicles.join(', ') : ''}
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Service Tickets</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openTickets.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Tickets currently being processed.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AMC Status</CardTitle>
                        <FileClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {activeAmc ? (
                            <>
                                <div className="text-lg font-bold">{activeAmc.planName}</div>
                                <p className="text-xs text-muted-foreground">
                                    Expires on {format(new Date(activeAmc.endDate), 'PPP')}
                                </p>
                            </>
                        ) : (
                             <div className="text-lg font-bold">Inactive</div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Service Tickets</CardTitle>
                    <CardDescription>A summary of your most recent service requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {complaints.length > 0 ? (
                        <div className="space-y-4">
                            {complaints.slice(0, 5).map(ticket => (
                                <div key={ticket.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{ticket.issue}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Vehicle: {ticket.vehicleNumber} | Submitted: {format(new Date(ticket.createdAt), 'PPP')}
                                        </p>
                                    </div>
                                    <Badge>{ticket.status}</Badge>
                                </div>
                            ))}
                             <Button variant="link" asChild className="mt-2">
                                <Link href="/customers/service-history">View All Service History</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>You haven't submitted any service tickets yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
