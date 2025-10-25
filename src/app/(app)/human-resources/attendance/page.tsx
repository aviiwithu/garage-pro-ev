
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAttendance } from '@/context/AttendanceContext';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Edit, FileText, LogOut, LogIn, Clock, Circle, Briefcase, Percent } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isValid, differenceInMilliseconds, formatDistanceToNowStrict, isSameDay } from 'date-fns';
import Papa from 'papaparse';
import { Calendar } from '@/components/ui/calendar';
import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EIGHT_AND_A_HALF_HOURS_MS = 8.5 * 60 * 60 * 1000;

export default function AttendancePage() {
    const { user } = useAuth();
    const { todaysRecords, records, fetchRecordsForMonth, clockIn, clockOut, loading: attendanceLoading } = useAttendance();
    const [month, setMonth] = useState(new Date());
    const [earlyCheckoutAlertOpen, setEarlyCheckoutAlertOpen] = useState(false);
    const [now, setNow] = useState(new Date());

    const loading = attendanceLoading;

    useEffect(() => {
        fetchRecordsForMonth(month);
    }, [month, fetchRecordsForMonth]);

    const currentRecord = useMemo(() => {
        if (!user) return null;
        return todaysRecords.find(r => r.technicianId === user.id && !r.clockOutTime);
    }, [todaysRecords, user]);
    
    const isClockedIn = !!currentRecord;

    useEffect(() => {
        if (isClockedIn) {
            const timer = setInterval(() => setNow(new Date()), 1000 * 60); // Update every minute
            return () => clearInterval(timer);
        }
    }, [isClockedIn]);

    const monthlyData = useMemo(() => {
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const daysInMonth = eachDayOfInterval({ start, end });
        
        const recordsForUser = records.filter(r => user && r.technicianId === user.id);

        return daysInMonth.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            // Find all records for the specific day
            const recordsForDay = recordsForUser.filter(r => r.date === dayStr);
            const isWeekend = [0, 6].includes(getDay(day));

            let status = 'Absent';
            if (recordsForDay.length > 0) status = 'Present';
            else if (isWeekend) status = 'Weekend';
            // In a real app, you'd check for 'Leave', 'Holiday' etc.

            return {
                date: day,
                status,
                records: recordsForDay, // Can be multiple check-ins per day
                isWeekend,
            };
        });
    }, [month, records, user]);
    
    const calendarModifiers = useMemo(() => {
        const presentDays = monthlyData.filter(d => d.status === 'Present').map(d => d.date);
        return {
            present: presentDays,
        };
    }, [monthlyData]);
    
    const calendarModifierStyles = {
        present: {
            textDecoration: 'underline',
            textDecorationColor: 'hsl(var(--primary))',
            textDecorationThickness: '2px',
            textUnderlineOffset: '3px',
        }
    };

    const monthlyStats = useMemo(() => {
        const totalWorkHours = monthlyData.reduce((total, day) => {
            const dailyMillis = day.records.reduce((dailyTotal, record) => {
                if (record.clockOutTime) {
                    return dailyTotal + (new Date(record.clockOutTime).getTime() - new Date(record.clockInTime).getTime());
                }
                return dailyTotal;
            }, 0);
            return total + dailyMillis;
        }, 0) / (1000 * 60 * 60); // convert to hours

        const totalWorkDays = monthlyData.filter(d => !d.isWeekend).length;
        const presentDays = monthlyData.filter(d => d.status === 'Present').length;
        const efficiency = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;

        return {
            totalWorkHours: totalWorkHours.toFixed(1),
            efficiency: efficiency.toFixed(1),
        };
    }, [monthlyData]);


    const handleDownload = () => {
        const dataToExport = monthlyData.flatMap(d => {
            if (d.records.length === 0) {
                 return {
                    date: format(d.date, 'dd/MM/yyyy'),
                    status: d.status,
                    checkIn: '-', checkOut: '-', duration: '-', remarks: '',
                };
            }
            return d.records.map(record => ({
                date: format(d.date, 'dd/MM/yyyy'),
                status: d.status,
                checkIn: record ? format(new Date(record.clockInTime), 'p') : '-',
                checkOut: record?.clockOutTime ? format(new Date(record.clockOutTime), 'p') : '-',
                duration: record && record.clockOutTime ? formatDuration(new Date(record.clockOutTime).getTime() - new Date(record.clockInTime).getTime()) : '-',
                remarks: '', // Placeholder
            }));
        });

        if (dataToExport.length === 0) {
            alert("No data available to download.");
            return;
        }

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance-${format(month, 'yyyy-MM')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDuration = (milliseconds: number) => {
        if (!isFinite(milliseconds) || milliseconds < 0) return '-';
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };
    
    const handleClockIn = () => {
        if (user && user.name) {
            clockIn(user.id, user.name);
        }
    }

    const handleClockOut = () => {
        if (currentRecord) {
            const duration = differenceInMilliseconds(new Date(), new Date(currentRecord.clockInTime));
            if (duration < EIGHT_AND_A_HALF_HOURS_MS) {
                setEarlyCheckoutAlertOpen(true);
            } else {
                confirmClockOut();
            }
        }
    };

    const confirmClockOut = () => {
        if (currentRecord) {
            clockOut(currentRecord.id);
        }
        setEarlyCheckoutAlertOpen(false);
    };
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <AlertDialog open={earlyCheckoutAlertOpen} onOpenChange={setEarlyCheckoutAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to clock out early?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your current session is less than 8 hours and 30 minutes. Please confirm if you wish to proceed.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmClockOut}>Proceed Anyway</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PageHeader
                title="Attendance"
                description="Manage your monthly attendance and leaves."
            >
                 <Button asChild variant="outline">
                    <Link href="/human-resources/attendance/report">
                        <FileText className="mr-2" />
                        View Daily Report
                    </Link>
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                     <CardHeader>
                        <CardTitle>Mark attendance for today ({format(new Date(), 'do MMM yyyy')})</CardTitle>
                        <CardDescription>
                            {isClockedIn && currentRecord
                                ? `You clocked in at ${format(new Date(currentRecord.clockInTime), 'p')}.`
                                : "You are currently clocked out."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <Button disabled className="w-full"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading...</Button>
                        ) : isClockedIn && currentRecord ? (
                            <div className="flex flex-col gap-2">
                                <Button className="w-full" onClick={handleClockOut} variant="destructive">
                                    <LogOut className="mr-2"/> Clock Out
                                </Button>
                                <div className="flex items-center text-muted-foreground p-2 rounded-md bg-muted justify-center">
                                    <Clock className="mr-2 h-4 w-4"/>
                                    <span>{formatDistanceToNowStrict(new Date(currentRecord.clockInTime), { addSuffix: false })}</span>
                                </div>
                            </div>
                        ) : (
                            <Button className="w-full" onClick={handleClockIn}>
                                <LogIn className="mr-2"/> Check In
                            </Button>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                                <Briefcase className="h-6 w-6 mb-2 text-primary"/>
                                <p className="text-2xl font-bold">{monthlyStats.totalWorkHours}</p>
                                <p className="text-xs text-muted-foreground">Total Hours</p>
                            </div>
                             <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                                <Percent className="h-6 w-6 mb-2 text-primary"/>
                                <p className="text-2xl font-bold">{monthlyStats.efficiency}%</p>
                                <p className="text-xs text-muted-foreground">Efficiency</p>
                            </div>
                        </div>

                        <Calendar
                            mode="single"
                            month={month}
                            onMonthChange={setMonth}
                            className="rounded-md border"
                            modifiers={calendarModifiers}
                            modifiersStyles={calendarModifierStyles}
                            components={{
                                DayContent: ({ date }) => {
                                    const dayData = monthlyData.find(d => isSameDay(d.date, date));
                                    let dotColor = '';
                                    if (dayData?.status === 'Present') dotColor = 'text-green-500';
                                    
                                    return (
                                        <div className="relative">
                                            {format(date, 'd')}
                                            {dotColor && <Circle className={`h-2 w-2 absolute -bottom-2 left-1/2 -translate-x-1/2 fill-current ${dotColor}`} />}
                                        </div>
                                    );
                                }
                            }}
                        />
                        <div className="flex justify-around text-xs text-muted-foreground pt-2">
                            <div className="flex items-center gap-2"><Circle className="h-2 w-2 text-green-500 fill-current"/> Present</div>
                        </div>
                         <Button variant="outline" className="w-full">Apply Leave</Button>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>My Attendance Log for {format(month, 'MMMM yyyy')}</CardTitle>
                            <CardDescription>To update your attendance data, please click on the edit button.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-96">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="max-h-[60vh] overflow-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Check In</TableHead>
                                            <TableHead>Check Out</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Remarks</TableHead>
                                            <TableHead>Edit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {monthlyData.map(({ date, status, records, isWeekend }) => {
                                            if (records.length === 0) {
                                                return (
                                                    <TableRow key={date.toISOString()}>
                                                         <TableCell>{format(date, 'dd/MM/yyyy')}</TableCell>
                                                        <TableCell><Badge variant={isWeekend ? 'secondary' : 'outline'}>{status}</Badge></TableCell>
                                                        <TableCell>-</TableCell><TableCell>-</TableCell><TableCell>-</TableCell><TableCell>-</TableCell><TableCell></TableCell>
                                                    </TableRow>
                                                )
                                            }
                                            return records.map((record, index) => (
                                                <TableRow key={record.id}>
                                                    <TableCell>{index === 0 ? format(date, 'dd/MM/yyyy') : ''}</TableCell>
                                                    <TableCell>{index === 0 && <Badge variant={isWeekend ? 'secondary' : 'default'}>{status}</Badge>}</TableCell>
                                                    <TableCell>{record?.clockInTime && isValid(new Date(record.clockInTime)) ? format(new Date(record.clockInTime), 'p') : '-'}</TableCell>
                                                    <TableCell>{record?.clockOutTime && isValid(new Date(record.clockOutTime)) ? format(new Date(record.clockOutTime), 'p') : '-'}</TableCell>
                                                    <TableCell>{(record?.clockInTime && record?.clockOutTime) ? formatDuration(new Date(record.clockOutTime).getTime() - new Date(record.clockInTime).getTime()) : '-'}</TableCell>
                                                    <TableCell>-</TableCell>
                                                    <TableCell>{!isWeekend && (<Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>)}</TableCell>
                                                </TableRow>
                                            ))
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
