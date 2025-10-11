
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle, FileUp } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddTechnicianForm } from '@/components/technicians/add-technician-form';
import { useEmployee, Employee } from '@/context/EmployeeContext';
import { Technician } from '@/lib/technician-data';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useComplaint } from '@/context/ComplaintContext';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { batchImportData } from '@/app/actions/data-ingestion';


function mapRowToDocument(row: Record<string, any>): Partial<Technician> {
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
        normalizedRow[key.trim().toLowerCase().replace(/[^a-z0-9]/gi, '')] = row[key];
    }
    
    return {
        name: normalizedRow.name,
        email: normalizedRow.email,
        specialization: normalizedRow.specialization || 'General',
        department: normalizedRow.department || 'COCO',
        designation: normalizedRow.designation || 'Technician',
        location: normalizedRow.location || 'Main Branch',
        panNumber: normalizedRow.pannumber,
        aadhaarNumber: normalizedRow.aadhaarnumber,
        bankDetails: {
            bankName: normalizedRow.bankname,
            accountNumber: normalizedRow.accountnumber,
            ifscCode: normalizedRow.ifsccode,
        },
        salaryStructure: {
            basic: parseFloat(normalizedRow.basicsalary) || 0,
            hra: parseFloat(normalizedRow.hra) || 0,
            allowances: [],
            deductions: [],
        },
        role: 'technician'
    } as unknown as Technician;
}

export default function TechniciansPage() {
    const { technicians, loading } = useEmployee();
    const { complaints, loading: complaintsLoading } = useComplaint();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | undefined>(undefined);

    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
    const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const handleEdit = (technician: Technician) => {
        setSelectedTechnician(technician);
        setDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedTechnician(undefined);
        setDialogOpen(true);
    }
    
    const calculateNetSalary = (tech: Technician) => {
        if (!tech.salaryStructure) return 0;
        const totalEarnings = (tech.salaryStructure.basic || 0) + (tech.salaryStructure.hra || 0) + (tech.salaryStructure.allowances?.reduce((acc, curr) => acc + curr.amount, 0) || 0);
        const totalDeductions = tech.salaryStructure.deductions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
        return totalEarnings - totalDeductions;
    };

    const technicianWorkload = useMemo(() => {
        const workload: Record<string, { activeTickets: number }> = {};
        
        technicians.forEach(tech => {
            workload[tech.name] = { activeTickets: 0 };
        });

        complaints.forEach(complaint => {
            if (complaint.assignedTo && complaint.status !== 'Closed' && complaint.status !== 'Resolved' && workload[complaint.assignedTo]) {
                workload[complaint.assignedTo].activeTickets++;
            }
        });

        return workload;
    }, [complaints, technicians]);

    const handleDownload = () => {
        const dataToExport = technicians.map(t => {
            const { salaryStructure, bankDetails, ...rest } = t;
            const flatSalary = {
                basicSalary: salaryStructure?.basic,
                hra: salaryStructure?.hra,
                allowances: salaryStructure?.allowances?.map(a => `${a.name}: ${a.amount}`).join(' | '),
                deductions: salaryStructure?.deductions?.map(d => `${d.name}: ${d.amount}`).join(' | '),
            };

            return {
                ...rest,
                netSalary: calculateNetSalary(t),
                activeTickets: technicianWorkload[t.name]?.activeTickets || 0,
                ...bankDetails,
                ...flatSalary
            }
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
        link.setAttribute('download', `technicians-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setParsedData([]);
        setFile(null);
        if (event.target.files && event.target.files.length > 0) {
            const uploadedFile = event.target.files[0];
            setFile(uploadedFile);
            parseFile(uploadedFile);
        }
    };
    
    const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/ /g, '').replace(/[^a-z0-9]/gi, '');

    const parseFile = (fileToParse: File) => {
        Papa.parse(fileToParse, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                 if (results.errors.length > 0) {
                    toast({ title: "Parsing Error", description: `Error: ${results.errors[0].message}`, variant: "destructive" });
                    return;
                }
                const requiredHeaders = ['name', 'email'];
                const headers = results.meta.fields || [];
                const normalizedHeaders = headers.map(normalizeHeader);

                const missingHeaders = requiredHeaders.filter(reqHeader => !normalizedHeaders.includes(reqHeader));

                if (missingHeaders.length > 0) {
                    toast({ title: "Missing Required Headers", description: `File must contain columns for: ${missingHeaders.join(', ')}.`, variant: "destructive" });
                    return;
                }
                setParsedData(results.data as any[]);
                setUploadHeaders(headers);
            }
        });
    };
    
    const handleImport = async () => {
        setIsImporting(true);
        try {
            const dataToImport = parsedData.map(mapRowToDocument).filter(d => d.name && d.email);
            if (dataToImport.length > 0) {
                await batchImportData('users', dataToImport);
            }

            toast({
                title: "Import Successful",
                description: `Data for ${dataToImport.length} technicians has been submitted for processing.`,
            });

        } catch (error: any) {
            toast({
                title: "Import Failed",
                description: error.message || "An unexpected error occurred during the import.",
                variant: "destructive",
            });
        } finally {
            setIsImporting(false);
            setParsedData([]);
            setUploadHeaders([]);
            setFile(null);
            const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
            if(fileInput) fileInput.value = "";
        }
    };
    
    const handleDownloadSample = () => {
        const sampleData = [{
            name: "John Doe",
            email: "john.doe@example.com",
            specialization: "Battery",
            department: "COCO",
            designation: "Sr. Technician",
            location: "Main Branch",
            panNumber: "ABCDE1234F",
            aadhaarNumber: "123456789012",
            bankName: "National Bank",
            accountNumber: "1234567890",
            ifscCode: "NBIN0000001",
            basicSalary: "30000",
            hra: "15000",
        }];
        const csv = Papa.unparse(sampleData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample-technician-import.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Technician Directory"
        description="Manage your technicians and their assignments."
      >
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2" />
            Download CSV
        </Button>
        <Dialog open={dialogOpen} onOpenChange={(isOpen) => {
            setDialogOpen(isOpen);
            if (!isOpen) setSelectedTechnician(undefined);
        }}>
            <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2" />
                    Add Technician
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{selectedTechnician ? 'Edit' : 'Add New'} Technician</DialogTitle>
                    <DialogDescription>
                        {selectedTechnician ? 'Update the details for the technician.' : 'Fill in the details to add a new technician.'}
                    </DialogDescription>
                </DialogHeader>
                <AddTechnicianForm 
                    technician={selectedTechnician} 
                    onSuccess={() => {
                        setDialogOpen(false);
                        setSelectedTechnician(undefined);
                    }} 
                />
            </DialogContent>
        </Dialog>
      </PageHeader>
        
        <Card>
            <CardHeader>
                <CardTitle>Bulk Upload Technicians</CardTitle>
                <CardDescription>Upload a CSV file to add multiple technicians at once.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button variant="outline" size="sm" onClick={handleDownloadSample} className="w-fit">
                    <Download className="mr-2 h-4 w-4"/>
                    Download Sample CSV
                </Button>
                <div className="flex items-center gap-2">
                    <Input id="bulk-upload-input" type="file" accept=".csv" onChange={handleFileChange} className="max-w-xs" />
                </div>
            </CardContent>
        </Card>

        {parsedData.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Upload Preview & Confirmation</CardTitle>
                    <CardDescription>Review the {parsedData.length} records before importing.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-md max-h-64">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                {uploadHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {parsedData.map((row, index) => (
                                <TableRow key={index}>
                                {uploadHeaders.map(header => <TableCell key={header}>{row[header]}</TableCell>)}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button onClick={handleImport} disabled={isImporting}>
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                            Confirm & Import
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Technicians</CardTitle>
            </CardHeader>
            <CardContent>
                {loading || complaintsLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>Net Salary</TableHead>
                            <TableHead>Active Tickets</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {technicians.map((tech) => (
                            <TableRow key={tech.id}>
                                <TableCell className="font-medium">{tech.name}</TableCell>
                                <TableCell>{tech.email}</TableCell>
                                <TableCell><Badge variant="secondary">{tech.specialization}</Badge></TableCell>
                                <TableCell>
                                    <span className="font-sans">INR </span>
                                    <span className="font-sans">₹</span><span className="font-code">{calculateNetSalary(tech).toLocaleString()}</span>
                                </TableCell>
                                <TableCell>{technicianWorkload[tech.name]?.activeTickets || 0}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleEdit(tech)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

    
