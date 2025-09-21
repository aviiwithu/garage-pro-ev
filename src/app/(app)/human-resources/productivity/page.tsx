

'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useComplaint } from '@/context/ComplaintContext';
import { useEmployee } from '@/context/EmployeeContext';
import { Loader2, User, Wrench, Clock, Download } from 'lucide-react';
import { differenceInHours } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import { format } from 'date-fns';

type TechnicianProductivity = {
    technicianId: string;
    name: string;
    totalTicketsResolved: number;
    averageResolutionTime: number; // in hours
    ticketsByPriority: Record<string, number>;
};

export default function ProductivityPage() {
    const { complaints, loading: complaintsLoading } = useComplaint();
    const { technicians, loading: techniciansLoading } = useEmployee();

    const loading = complaintsLoading || techniciansLoading;

    const productivityData = useMemo(() => {
        if (loading) return [];
        
        const resolvedComplaints = complaints.filter(c => 
            (c.status === 'Resolved' || c.status === 'Closed') && 
            c.assignedTo && c.assignedTo !== 'Unassigned' &&
            c.resolvedAt
        );

        const techProductivityMap = new Map<string, {
            ticketCount: number,
            totalHours: number,
            priorityCounts: Record<string, number>
        }>();

        resolvedComplaints.forEach(complaint => {
            const techName = complaint.assignedTo;
            if (!techName) return;

            const tech = technicians.find(t => t.name === techName);
            if (!tech) return;

            const stats = techProductivityMap.get(tech.id) || { ticketCount: 0, totalHours: 0, priorityCounts: {} };
            
            stats.ticketCount++;
            if (complaint.resolvedAt) {
                const resolutionHours = differenceInHours(new Date(complaint.resolvedAt), new Date(complaint.createdAt));
                stats.totalHours += resolutionHours;
            }
            
            const priority = (complaint as any).priority || 'Medium';
            stats.priorityCounts[priority] = (stats.priorityCounts[priority] || 0) + 1;

            techProductivityMap.set(tech.id, stats);
        });

        const finalData: TechnicianProductivity[] = technicians.map(tech => {
            const stats = techProductivityMap.get(tech.id);
            return {
                technicianId: tech.id,
                name: tech.name,
                totalTicketsResolved: stats?.ticketCount || 0,
                averageResolutionTime: (stats && stats.ticketCount > 0) ? parseFloat((stats.totalHours / stats.ticketCount).toFixed(1)) : 0,
                ticketsByPriority: stats?.priorityCounts || {}
            }
        });

        return finalData.sort((a,b) => b.totalTicketsResolved - a.totalTicketsResolved);
    }, [complaints, technicians, loading]);

    const overallStats = useMemo(() => {
        if (!productivityData) return { totalResolved: 0, avgTime: 0 };
        const totalResolved = productivityData.reduce((sum, tech) => sum + tech.totalTicketsResolved, 0);
        const totalTime = productivityData.reduce((sum, tech) => sum + (tech.averageResolutionTime * tech.totalTicketsResolved), 0);
        return {
            totalResolved,
            avgTime: totalResolved > 0 ? (totalTime / totalResolved).toFixed(1) : '0'
        };
    }, [productivityData]);
    
    const handleDownload = () => {
        const dataToExport = productivityData.map(d => ({
            technicianId: d.technicianId,
            name: d.name,
            totalTicketsResolved: d.totalTicketsResolved,
            averageResolutionTimeHours: d.averageResolutionTime,
            highPriorityTickets: d.ticketsByPriority['High'] || 0,
            criticalPriorityTickets: d.ticketsByPriority['Critical'] || 0,
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `productivity-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                title="Technician Productivity"
                description="Analyze performance based on resolved service tickets."
            >
                <Button variant="outline" onClick={handleDownload} disabled={loading}>
                    <Download className="mr-2" />
                    Download CSV
                </Button>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Technicians</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{technicians.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets Resolved</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{overallStats.totalResolved}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Avg. Resolution Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{overallStats.avgTime} Hours</p></CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Productivity Breakdown</CardTitle>
                        <CardDescription>Detailed metrics for each technician.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Technician</TableHead>
                                    <TableHead>Tickets Resolved</TableHead>
                                    <TableHead>Avg. Time (Hours)</TableHead>
                                    <TableHead>High/Critical Tickets</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productivityData.map(tech => (
                                    <TableRow key={tech.technicianId}>
                                        <TableCell className="font-medium">{tech.name}</TableCell>
                                        <TableCell>{tech.totalTicketsResolved}</TableCell>
                                        <TableCell>{tech.averageResolutionTime}</TableCell>
                                        <TableCell>{(tech.ticketsByPriority['High'] || 0) + (tech.ticketsByPriority['Critical'] || 0)}</TableCell>
                                    </TableRow>
                                ))}
                                {productivityData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No productivity data available.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Tickets Resolved per Technician</CardTitle>
                         <CardDescription>Visual comparison of technician output.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{resolved: {label: 'Tickets', color: 'hsl(var(--chart-1))'}}} className="h-[300px] w-full">
                            <BarChart data={productivityData} layout="vertical">
                                <CartesianGrid horizontal={false} />
                                <YAxis 
                                    dataKey="name" 
                                    type="category"
                                    tickLine={false} 
                                    axisLine={false}
                                    tickMargin={8}
                                    width={80}
                                />
                                <XAxis 
                                    dataKey="totalTicketsResolved"
                                    type="number"
                                    />
                                <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="totalTicketsResolved" name="Tickets Resolved" fill="var(--color-resolved)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
