
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAttendance } from '@/context/AttendanceContext';
import { useEmployee } from '@/context/EmployeeContext';
import { useMemo } from 'react';
import { Loader2, UserCheck, UserX, CalendarOff, Percent } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, getDay } from 'date-fns';

export default function AttendanceReportPage() {
    const { todaysRecords, loading: attendanceLoading } = useAttendance();
    const { employees, loading: employeesLoading } = useEmployee();

    const loading = attendanceLoading || employeesLoading;

    const reportData = useMemo(() => {
        if (loading) return { present: 0, absent: 0, onLeave: 0, efficiency: 0, details: [] };

        const today = new Date();
        const isWeekend = [0, 6].includes(getDay(today));

        const details = employees.map(emp => {
            const record = todaysRecords.find(r => r.technicianId === emp.id);
            let status: 'Present' | 'Absent' | 'On Leave' | 'Weekend' = 'Absent';

            if (record) {
                status = 'Present';
            } else if (isWeekend) {
                status = 'Weekend';
            }
            // In a real app, you would check a 'leaves' collection here for 'On Leave' status.

            return {
                id: emp.id,
                name: emp.name,
                role: emp.role,
                status,
                clockInTime: record ? format(new Date(record.clockInTime), 'p') : '-',
            };
        });

        const present = details.filter(d => d.status === 'Present').length;
        const totalWorkforce = employees.length;
        // Exclude weekend from absent calculation
        const absent = isWeekend ? 0 : details.filter(d => d.status === 'Absent').length;
        const onLeave = 0; // Placeholder
        const efficiency = totalWorkforce > 0 ? (present / totalWorkforce) * 100 : 0;

        return { present, absent, onLeave, efficiency, details };
    }, [employees, todaysRecords, loading]);
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Present': return 'default';
            case 'Absent': return 'destructive';
            case 'On Leave': return 'secondary';
            case 'Weekend': return 'outline';
            default: return 'outline';
        }
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
                title="Daily Attendance Report"
                description={`A summary of attendance for ${format(new Date(), 'PPP')}.`}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Present</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{reportData.present}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Absent</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{reportData.absent}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{reportData.onLeave}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{reportData.efficiency.toFixed(1)}%</p></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Employee Status Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Clock-in Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.details.map(emp => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell>{emp.role}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(emp.status)}>
                                            {emp.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{emp.clockInTime}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
