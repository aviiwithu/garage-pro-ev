
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthProvider';
import { useComplaint } from '@/context/ComplaintContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, FileText, Clock, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { differenceInHours, format, subDays, isAfter } from 'date-fns';

export function TechnicianDashboard() {
    const { user, loading: authLoading } = useAuth();
    const { complaints, loading: complaintsLoading } = useComplaint();
    const loading = authLoading || complaintsLoading;

    const techStats = useMemo(() => {
        if (!user) return { openTickets: 0, avgResolutionTime: '0', resolvedThisMonth: 0, recentTickets: [] };

        const myTickets = complaints.filter(c => c.assignedTo === user.name);
        const openTickets = myTickets.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;

        const resolvedTickets = myTickets.filter(c => (c.status === 'Resolved' || c.status === 'Closed') && c.resolvedAt);

        const totalRepairHours = resolvedTickets.reduce((acc, c) => {
            if (!c.resolvedAt) return acc;
            const created = new Date(c.createdAt);
            const resolved = new Date(c.resolvedAt);
            return acc + differenceInHours(resolved, created);
        }, 0);

        const avgResolutionTime = resolvedTickets.length > 0 ? (totalRepairHours / resolvedTickets.length).toFixed(1) : "0";

        const oneMonthAgo = subDays(new Date(), 30);
        const resolvedThisMonth = resolvedTickets.filter(c => c.resolvedAt && isAfter(new Date(c.resolvedAt), oneMonthAgo)).length;
        
        const recentTickets = myTickets.slice(0, 5);

        return {
            openTickets,
            avgResolutionTime,
            resolvedThisMonth,
            recentTickets,
        };

    }, [complaints, user]);

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
                title={`Welcome, ${user?.name}`}
                description="Here is a summary of your workload and performance."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Open Tickets</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{techStats.openTickets}</div>
                        <p className="text-xs text-muted-foreground">Tickets assigned to you that are active.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{techStats.avgResolutionTime} Hours</div>
                         <p className="text-xs text-muted-foreground">Your average time to resolve tickets.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved (Last 30 Days)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{techStats.resolvedThisMonth}</div>
                         <p className="text-xs text-muted-foreground">Tickets you've resolved this month.</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your 5 most recently assigned or updated tickets.</CardDescription>
                </CardHeader>
                <CardContent>
                    {techStats.recentTickets.length > 0 ? (
                        <div className="space-y-4">
                            {techStats.recentTickets.map(ticket => (
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
                                <Link href="/operations/complaint-dashboard">View All My Tickets</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>You have no assigned tickets yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

