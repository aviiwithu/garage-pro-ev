
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Download, Loader2, PlusCircle, FileUp } from 'lucide-react';
import { useEmployee, Employee } from '@/context/EmployeeContext';
import { EmployeeTable } from '@/components/employees/employee-table';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddTechnicianForm } from '@/components/technicians/add-technician-form';
import { Technician } from '@/lib/technician-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { batchImportData } from '@/app/actions/data-ingestion';


function mapRowToDocument(row: Record<string, any>): Partial<Employee> {
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
        normalizedRow[key.trim().toLowerCase().replace(/[^a-z0-9]/gi, '')] = row[key];
    }
    
    return {
        employeeId: normalizedRow.employeeid,
        name: normalizedRow.name,
        email: normalizedRow.email,
        phone: normalizedRow.phone,
        gender: normalizedRow.gender,
        pan: normalizedRow.pan,
        title: normalizedRow.title,
        department: normalizedRow.department,
        manager: normalizedRow.manager,
        dateOfJoining: new Date().toISOString(),
        dateOfBirth: new Date().toISOString(),
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
        role: 'technician' // Default role for bulk import
    } as Partial<Employee>;
}


export default function EmployeesPage() {
    const { employees, loading } = useEmployee();
    const [dialogOpen, setDialogOpen] = useState(false);
    
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
    const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    
    const handleDownload = () => {
        if (employees.length === 0) {
            alert("No data available to download.");
            return;
        }

        const dataToExport = employees.map(e => {
            const isTechnician = 'specialization' in e;
            const { salaryStructure, bankDetails, ...rest } = e as any;
            const flatData: Record<string, any> = { ...rest };

            if (isTechnician) {
                 if (bankDetails) {
                    flatData.bankName = bankDetails.bankName;
                    flatData.accountNumber = bankDetails.accountNumber;
                    flatData.ifscCode = bankDetails.ifscCode;
                }
                if (salaryStructure) {
                    flatData.basicSalary = salaryStructure.basic;
                    flatData.hra = salaryStructure.hra;
                    flatData.allowances = salaryStructure.allowances?.map((a: any) => `${a.name}: ${a.amount}`).join(' | ');
                    flatData.deductions = salaryStructure.deductions?.map((d: any) => `${d.name}: ${d.amount}`).join(' | ');
                }
            }
           
            return flatData;
        });

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `employees-${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
    
    const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');

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
                const requiredHeaders = ['employeeid', 'name', 'email'];
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
            const dataToImport = parsedData.map(mapRowToDocument).filter(d => d.id && d.name && d.email);
            if(dataToImport.length > 0) {
                await batchImportData('users', dataToImport);
            }

            toast({
                title: "Import Successful",
                description: `Data for ${dataToImport.length} employees has been submitted for processing.`,
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
            'Employee ID': 'EMP001',
            'Name': 'John Doe',
            'Email': 'john.doe@example.com',
            'Phone': '9876543210',
            'Gender': 'Male',
            'PAN': 'ABCDE1234F',
            'Title': 'Sr. Technician',
            'Department': 'COCO',
            'Manager': 'Jane Smith',
            'Added On': '2023-01-15',
            'Date of Birth': '1990-05-20',
            'Date of Joining': '2023-01-15',
            'Date of Leaving': '',
            'Stop Salary': 'No',
            'PF': 'Yes',
            'PF Status': 'Active',
            'UAN': '100987654321',
            'ESIC IP Number': '2198765432',
            'ESIC Status': 'Active',
            'Resident of India': 'Yes',
            'Bank Account Number': '1234567890',
            'Bank IFSC': 'BKID0001234'
        }];
        const csv = Papa.unparse(sampleData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample-employee-import.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="Employee Directory"
                description="Manage all employees across different roles."
            >
                <Button variant="outline" onClick={handleDownload} disabled={loading}>
                    <Download className="mr-2" />
                    Download CSV
                </Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Add Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                Fill in the details to add a new employee to the directory.
                            </DialogDescription>
                        </DialogHeader>
                        <AddTechnicianForm 
                            onSuccess={() => setDialogOpen(false)} 
                        />
                    </DialogContent>
                </Dialog>
            </PageHeader>

             <Card>
                <CardHeader>
                    <CardTitle>Bulk Upload Employees</CardTitle>
                    <CardDescription>Upload a CSV file to add multiple employees at once. Ensure the file has 'Employee ID', 'Name', and 'Email' columns.</CardDescription>
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


            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <EmployeeTable employees={employees} />
            )}
        </div>
    );
}
