
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, FileText, Clock, UserCheck, Loader2, DollarSign, AlertCircle, CalendarClock, CalendarCheck, Eye, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { differenceInHours, format, differenceInDays, isToday, isAfter, addDays, startOfDay } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { ChartConfig } from '@/components/ui/chart';
import { PageHeader } from '@/components/shared/page-header';
import { useComplaint } from '@/context/ComplaintContext';
import { useEmployee } from '@/context/EmployeeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

const chartConfig = {
  inService: {
    label: 'In Service',
    color: 'hsl(var(--chart-1))',
  },
  awaitingService: {
    label: 'Awaiting Service',
    color: 'hsl(var(--chart-2))',
  },
  completed: {
    label: 'Completed',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function AdminDashboard() {
    const { complaints, invoices, loading: complaintsLoading } = useComplaint();
    const { technicians, loading: techniciansLoading } = useEmployee();
    const { user, role, setViewAsRole, viewAsRole } = useAuth();
    const loading = complaintsLoading || techniciansLoading;
    const router = useRouter();
    const [clientReady, setClientReady] = useState(false);

    useEffect(() => {
        setClientReady(true);
    }, []);


    const dashboardStats = useMemo(() => {
        if (!clientReady) return { vehiclesInWorkshop: 0, openRepairOrders: 0, avgRepairTime: '0', availableTechnicians: 0, criticalAlerts: 0, statusDistribution: [], repairTimeTrend: [] };
        
        const vehiclesInWorkshop = complaints.filter(c => c.status !== 'Closed' && c.status !== 'Resolved').length;
        const openRepairOrders = complaints.filter(c => c.status === 'Open').length;
        
        const completedTickets = complaints.filter(c => (c.status === 'Closed' || c.status === 'Resolved') && c.resolvedAt);
        const totalRepairHours = completedTickets.reduce((acc, c) => {
            if (!c.resolvedAt) return acc;
            const created = new Date(c.createdAt);
            const resolved = new Date(c.resolvedAt);
            return acc + differenceInHours(resolved, created);
        }, 0);
        
        const avgRepairTime = completedTickets.length > 0 ? (totalRepairHours / completedTickets.length).toFixed(1) : "0";


        const availableTechnicians = technicians.length;
        const criticalAlerts = 3; // Placeholder until alerts are fully dynamic

        // For charts
        const statusDistribution = complaints.reduce((acc, c) => {
            if (['In Progress', 'Technician Assigned', 'Estimate Approved'].includes(c.status)) {
                acc.inService = (acc.inService || 0) + 1;
            } else if (['Open', 'Estimate Shared'].includes(c.status)) {
                acc.awaitingService = (acc.awaitingService || 0) + 1;
            } else if (['Resolved', 'Closed'].includes(c.status)) {
                acc.completed = (acc.completed || 0) + 1;
            }
            return acc;
        }, { inService: 0, awaitingService: 0, completed: 0 });

        const repairTimeByMonth = completedTickets.reduce((acc, c) => {
            if (!c.resolvedAt) return acc;
            const month = format(new Date(c.resolvedAt), 'MMM');
            const hours = differenceInHours(new Date(c.resolvedAt), new Date(c.createdAt));
            if (!acc[month]) {
                acc[month] = { totalHours: 0, count: 0 };
            }
            acc[month].totalHours += hours;
            acc[month].count++;
            return acc;
        }, {} as Record<string, { totalHours: number, count: 0 }>);
        
        const repairTimeTrend = Object.keys(repairTimeByMonth).map(month => ({
            month,
            averageHours: repairTimeByMonth[month].totalHours / repairTimeByMonth[month].count
        })).slice(-6); // Last 6 months

        return {
            vehiclesInWorkshop,
            openRepairOrders,
            avgRepairTime,
            availableTechnicians,
            criticalAlerts,
            statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value, fill: `var(--color-${name})` })),
            repairTimeTrend
        };
    }, [complaints, technicians, clientReady]);
    
    const receivablesStats = useMemo(() => {
        if (!clientReady) return { totalOutstanding: 0, dueToday: 0, dueWithin30Days: 0, totalOverdue: 0, averagePaymentTime: 0 };

        const today = startOfDay(new Date());
        const thirtyDaysFromNow = addDays(today, 30);
        
        const unpaidInvoices = invoices.filter(inv => inv.status === 'Unpaid');
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid');

        const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
        
        const overdueInvoices = unpaidInvoices.filter(inv => isAfter(today, addDays(startOfDay(new Date(inv.date)), 30)));
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

        const dueToday = unpaidInvoices.filter(inv => {
            const dueDate = addDays(startOfDay(new Date(inv.date)), 30);
            return isToday(dueDate);
        }).reduce((sum, inv) => sum + inv.total, 0);

        const dueWithin30Days = unpaidInvoices.filter(inv => {
            const dueDate = addDays(startOfDay(new Date(inv.date)), 30);
            return !isAfter(dueDate, thirtyDaysFromNow) && isAfter(dueDate, today);
        }).reduce((sum, inv) => sum + inv.total, 0);

        const totalPaymentDays = paidInvoices.reduce((acc, inv) => {
            const complaint = complaints.find(c => c.id === inv.ticketId);
            if (!complaint || !complaint.resolvedAt) return acc;
            const paymentDate = new Date(complaint.resolvedAt); // Assume payment date is resolution date
            const invoiceDate = new Date(inv.date);
            return acc + differenceInDays(paymentDate, invoiceDate);
        }, 0);
        
        const averagePaymentTime = paidInvoices.length > 0 ? Math.round(totalPaymentDays / paidInvoices.length) : 0;

        return {
            totalOutstanding,
            dueToday,
            dueWithin30Days,
            totalOverdue,
            averagePaymentTime
        };
    }, [invoices, complaints, clientReady]);
    

  if (loading || !clientReady) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <PageHeader
            title="Dashboard"
            description="A high-level overview of your garage's operations."
        >
        {role === 'admin' && (
            <div className="flex items-center gap-2">
                <Button variant={viewAsRole === 'technician' ? 'default' : 'outline'} onClick={() => setViewAsRole(viewAsRole === 'technician' ? null : 'technician')}>
                    <Eye className="mr-2"/> View as Technician
                </Button>
                <Button variant={viewAsRole === 'customer' ? 'default' : 'outline'} onClick={() => setViewAsRole(viewAsRole === 'customer' ? null : 'customer')}>
                    <Eye className="mr-2"/> View as Customer
                </Button>
                 {viewAsRole && <Button variant="ghost" onClick={() => setViewAsRole(null)}>Reset View</Button>}
            </div>
        )}
        </PageHeader>

        <Tabs defaultValue="workshop">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="workshop">Workshop Overview</TabsTrigger>
                <TabsTrigger value="receivables">Receivables Overview</TabsTrigger>
            </TabsList>
            <TabsContent value="workshop" className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/operations/complaint-dashboard">
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Vehicles in Workshop</CardTitle>
                                <Wrench className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardStats.vehiclesInWorkshop}</div>
                                <p className="text-xs text-muted-foreground">Currently being serviced</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/operations/complaint-dashboard">
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Open Repair Orders</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardStats.openRepairOrders}</div>
                                <p className="text-xs text-muted-foreground">Active service tickets</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Repair Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardStats.avgRepairTime} Hours</div>
                            <p className="text-xs text-muted-foreground">For all closed tickets</p>
                        </CardContent>
                    </Card>
                    <Link href="/human-resources/technicians">
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Available Technicians</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardStats.availableTechnicians}</div>
                                <p className="text-xs text-muted-foreground">Ready for assignment</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </TabsContent>
            <TabsContent value="receivables" className="space-y-4 pt-4">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold"><span className="font-code">₹</span><span className="font-code">{receivablesStats.totalOutstanding.toLocaleString()}</span></div>
                            <p className="text-xs text-muted-foreground">Across all unpaid invoices</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold"><span className="font-code">₹</span><span className="font-code">{receivablesStats.totalOverdue.toLocaleString()}</span></div>
                             <p className="text-xs text-muted-foreground">Past due by over 30 days</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Due in 30 Days</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold"><span className="font-code">₹</span><span className="font-code">{receivablesStats.dueWithin30Days.toLocaleString()}</span></div>
                            <p className="text-xs text-muted-foreground">Upcoming payments</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Payment Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{receivablesStats.averagePaymentTime} Days</div>
                            <p className="text-xs text-muted-foreground">From invoice to payment</p>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Link href="/operations/complaint-dashboard" className="lg:col-span-2">
            <Card className="h-full hover:bg-muted/50 transition-colors">
            <CardHeader>
                <CardTitle>Vehicle Status Distribution</CardTitle>
                <CardDescription>Live breakdown of vehicle statuses in the workshop.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={dashboardStats.statusDistribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            strokeWidth={5}
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
            </Card>
        </Link>
         <Link href="/operations/complaint-dashboard" className="lg:col-span-3">
            <Card className="h-full hover:bg-muted/50 transition-colors">
            <CardHeader>
                <CardTitle>Repair Time Trend</CardTitle>
                <CardDescription>Monthly average time (in hours) per repair order.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{averageHours: {label: 'Hours', color: 'hsl(var(--chart-1))'}}} className="h-[250px] w-full">
                    <BarChart data={dashboardStats.repairTimeTrend}>
                        <CartesianGrid vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            tickLine={false} 
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis 
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}h`}
                        />
                        <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="averageHours" fill="var(--color-averageHours)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            </Card>
        </Link>
      </div>
    </div>
  );
}
