
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle, FileUp, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddTechnicianForm } from '@/components/technicians/add-technician-form';
import { useEmployee } from '@/context/EmployeeContext';
import { Technician, TechnicianBulkUpload } from '@/lib/technician-data';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useComplaint } from '@/context/ComplaintContext';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { batchImportData } from '@/app/actions/data-ingestion';
import * as XLSX from 'xlsx';
import { parseArrayString } from '@/lib/utils';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { columns } from '@/components/technicians/columns';
import { TechnicianDetails } from '@/components/technicians/technician-details';



function mapRowToDocument(row: Record<string, any>): Partial<Technician> {
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
        normalizedRow[key.trim().replace(/[^a-z0-9.]/gi, '')] = row[key];
    }

    return {
        name: normalizedRow.name,
        email: normalizedRow.email,
        specialization: normalizedRow.specialization || 'General',
        department: normalizedRow.department ?? '',
        designation: normalizedRow.designation || 'Technician',
        location: normalizedRow.location ? normalizedRow.location.split(',') : [],
        panNumber: normalizedRow.panNumber,
        aadhaarNumber: normalizedRow.aadhaarNumber,
        bankDetails: {
            bankName: normalizedRow["bankDetails.bankName"],
            accountNumber: normalizedRow["bankDetails.accountNumber"],
            ifscCode: normalizedRow["bankDetails.ifscCode"],
        },
        dateOfBirth: normalizedRow.dateOfBirth??'',
        dateOfJoining: normalizedRow.dateOfJoining??'',
        salaryStructure: {
            basic: parseFloat(normalizedRow["salaryStructure.basic"]) || 0,
            hra: parseFloat(normalizedRow["salaryStructure.hra"]) || 0,
            allowances: parseArrayString(normalizedRow["salaryStructure.allowances"]),
            deductions: parseArrayString(normalizedRow["salaryStructure.deductions"]),
        },
        role: 'technician'
    } as unknown as Technician;
}

export default function TechniciansPage() {
    const { technicians, loading } = useEmployee();
    const { complaints, loading: complaintsLoading } = useComplaint();
    const [dialogOpen, setDialogOpen] = useState(false);
        const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | undefined>(undefined);
        const [viewingTechnician, setViewingTechnician] = useState<Technician | undefined>(undefined);


    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
    const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

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

    const tableData = useMemo(() => technicians.map(tech => ({
        ...tech,
        activeTickets: technicianWorkload[tech.name]?.activeTickets || 0,
    })), [technicians, technicianWorkload]);

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        meta: {
             viewTechnician: (technician: Technician) => {
                setViewingTechnician(technician);
                setViewDialogOpen(true);
            },
            editTechnician: (technician: Technician) => {
                setSelectedTechnician(technician);
                setDialogOpen(true);
            },
            removeTechnician: (technician: Technician) => {
                // Implement remove logic here
                console.log('Removing:', technician.name);
            }
        }
    });

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
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (json.length === 0) {
                    toast({ title: "Parsing Error", description: "The file is empty.", variant: "destructive" });
                    return;
                }

                const headers: string[] = json[0] as string[];
                const rows: Record<string, any>[] = (json.slice(1) as any[][]).map(row => {
                    const rowData: Record<string, any> = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index];
                    });
                    return rowData;
                });

                setUploadHeaders(headers);
                setParsedData(rows);

            } catch (error) {
                toast({ title: "Parsing Error", description: "Failed to parse the file.", variant: "destructive" });
                console.error(error);
            }
        };
        reader.onerror = (error) => {
            toast({ title: "File Read Error", description: "Failed to read the file.", variant: "destructive" });
        }
        reader.readAsArrayBuffer(fileToParse);
    };

    const handleDiscardImport = () => {
        setIsImporting(false);
        setParsedData([]);
        setUploadHeaders([]);
        setFile(null);
        const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    }

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
            if (fileInput) fileInput.value = "";
        }
    };


    const handleDownloadSample = () => {
        const sampleData: TechnicianBulkUpload[] = [{
            name: "",
            email: "john.doe@example.com",
            specialization: "Battery",
            department: "COCO",
            designation: "Sr. Technician",
            location: "BR-1,BR-2",
            panNumber: "ABCDE1234F",
            aadhaarNumber: "123456789012",
            "bankDetails.bankName": "National Bank",
            "bankDetails.accountNumber": "1234567890",
            "bankDetails.ifscCode": "NBIN0000001",
            "salaryStructure.basic": 30000,
            "salaryStructure.hra": 30000,
            employeeId: '',
            phone: '9876543210',
            gender: 'Male',
            dateOfBirth: '',
            dateOfJoining: '',
            // role: 'technician',
            residentOfIndia: false,
            stopSalary: false,
            pf: false,
            pfStatus: 'Active',
            esicStatus: 'Active',
            'salaryStructure.allowances': "[{name: 'Travel Allowance', amount: 5000}]",
            'salaryStructure.deductions': "[{name: 'Health Insurance', amount: 1000} ]"
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
                <Dialog modal={false} open={dialogOpen} onOpenChange={(isOpen) => {
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
                        <Download className="mr-2 h-4 w-4" />
                        Download Sample CSV
                    </Button>
                    <div className="flex items-center gap-2">
                        <Input id="bulk-upload-input" type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="max-w-xs" />
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
                        <div className="flex justify-end mt-4 gap-2">
                            <Button variant={"destructive"} onClick={() => handleDiscardImport()} >
                                <X className='h-4 w-4' />
                                Discard
                            </Button>
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
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Search technicians..."
                            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading || complaintsLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Technician Details</DialogTitle>
                </DialogHeader>
                {viewingTechnician && <TechnicianDetails technician={viewingTechnician} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}


