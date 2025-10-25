
'use client';

import { Technician } from '@/lib/technician-data';
import { Complaint } from '@/lib/complaint-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useComplaint } from '@/context/ComplaintContext';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';

interface TechnicianDetailsProps {
    technician: Technician;
}

const DetailItem = ({ label, value }: { label: string; value?: string | number | null; }) => {
    if (!value && value !== 0) return null;
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-semibold">{String(value)}</p>
        </div>
    );
};

export function TechnicianDetails({ technician }: TechnicianDetailsProps) {
    const { complaints } = useComplaint();
    const router = useRouter();

    const activeTickets = useMemo(() => {
        return complaints.filter(c => c.assignedTo === technician.name && c.status !== 'Closed' && c.status !== 'Resolved');
    }, [complaints, technician.name]);

    const handleTicketClick = (ticketId: string) => {
        // This is a simplified navigation. A more robust solution might involve
        // passing the selected ticket to the dashboard page to open the dialog directly.
        // router.push('/operations/complaint-dashboard');
    }

    const netSalary = useMemo(() => {
        if (!technician.salaryStructure) return 0;
        const totalEarnings = (technician.salaryStructure.basic || 0) + (technician.salaryStructure.hra || 0) + (technician.salaryStructure.allowances?.reduce((acc, curr) => acc + curr.amount, 0) || 0);
        const totalDeductions = technician.salaryStructure.deductions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
        return totalEarnings - totalDeductions;
    }, [technician.salaryStructure]);

    return (
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{technician.name}</CardTitle>
                            <CardDescription>{technician.designation} - {technician.specialization}</CardDescription>
                        </div>
                         <Badge variant="secondary">{technician.employeeId}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="details">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="tickets">Active Tickets ({activeTickets.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="pt-4 space-y-6">
                            
                             <div>
                                <h4 className="font-medium mb-2 text-primary">Personal Information</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 text-sm">
                                    <DetailItem label="Email" value={technician.email} />
                                    <DetailItem label="Phone" value={technician.phone} />
                                    <DetailItem label="Gender" value={technician.gender} />
                                    <DetailItem label="Date of Birth" value={format(new Date(technician.dateOfBirth), 'PPP')} />
                                </div>
                            </div>
                            
                            <Separator />

                            <div>
                                <h4 className="font-medium mb-2 text-primary">Work Information</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 text-sm">
                                    <DetailItem label="Date of Joining" value={format(new Date(technician.dateOfJoining), 'PPP')} />
                                    {technician.dateOfLeaving && <DetailItem label="Date of Leaving" value={format(new Date(technician.dateOfLeaving), 'PPP')} />}
                                    <DetailItem label="Department" value={technician.department} />
                                    <DetailItem label="Manager" value={technician.manager} />
                                    <DetailItem label="Location(s)" value={Array.isArray(technician.location) ? technician.location.join(', ') : technician.location} />
                                </div>
                            </div>

                            <Separator />

                             <div>
                                <h4 className="font-medium mb-2 text-primary">Statutory & Bank Details</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 text-sm">
                                    <DetailItem label="PAN" value={technician.panNumber} />
                                    <DetailItem label="Aadhaar" value={technician.aadhaarNumber} />
                                    <DetailItem label="Bank Name" value={technician.bankDetails?.bankName} />
                                    <DetailItem label="Account No." value={technician.bankDetails?.accountNumber} />
                                    <DetailItem label="IFSC Code" value={technician.bankDetails?.ifscCode} />
                                </div>
                            </div>

                            <Separator />
                            
                             <div>
                                <h4 className="font-medium mb-2 text-primary">Salary & Compensation</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 text-sm">
                                    <DetailItem label="Basic Salary" value={`₹${technician.salaryStructure?.basic.toLocaleString()}`} />
                                    <DetailItem label="HRA" value={`₹${technician.salaryStructure?.hra.toLocaleString()}`} />
                                    <DetailItem label="Net Salary" value={`₹${netSalary.toLocaleString()}`} />
                                </div>
                                {technician.salaryStructure?.allowances && technician.salaryStructure.allowances.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="text-sm text-muted-foreground">Allowances</h5>
                                        {technician.salaryStructure.allowances.map(a => <DetailItem key={a.name} label={a.name} value={`₹${a.amount.toLocaleString()}`} />)}
                                    </div>
                                )}
                                 {technician.salaryStructure?.deductions && technician.salaryStructure.deductions.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="text-sm text-muted-foreground">Deductions</h5>
                                        {technician.salaryStructure.deductions.map(d => <DetailItem key={d.name} label={d.name} value={`₹${d.amount.toLocaleString()}`} />)}
                                    </div>
                                )}
                            </div>

                        </TabsContent>
                        <TabsContent value="tickets">
                            <Card>
                                <CardContent className="pt-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Ticket ID</TableHead>
                                                <TableHead>Issue</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Submitted</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeTickets.length > 0 ? (
                                                activeTickets.map(ticket => (
                                                    <TableRow key={ticket.id} onClick={() => handleTicketClick(ticket.id)} className="cursor-pointer">
                                                        <TableCell className="font-mono">{ticket.id.substring(0, 8)}</TableCell>
                                                        <TableCell>{ticket.issue}</TableCell>
                                                        <TableCell><Badge>{ticket.status}</Badge></TableCell>
                                                        <TableCell>{format(new Date(ticket.createdAt), 'PPP')}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center h-24">
                                                        No active tickets assigned.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
