
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Download, FileUp } from 'lucide-react';
import { Customer } from '@/lib/customer-data';
import { CustomerList } from '@/components/customers/customer-list';
import { AddCustomerForm } from '@/components/customers/add-customer-form';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useEmployee } from '@/context/EmployeeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { batchImportData } from '@/app/actions/data-ingestion';

function mapRowToDocument(row: Record<string, any>): Partial<Customer> {
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
        normalizedRow[key.trim().toLowerCase().replace(/[^a-z0-9]/gi, '')] = row[key];
    }
    
    return {
        name: normalizedRow.displayname || `${normalizedRow.firstname} ${normalizedRow.lastname}`,
        displayName: normalizedRow.displayname,
        email: normalizedRow.emailid,
        mobile: normalizedRow.mobilephone,
        workPhone: normalizedRow.phone,
        type: (normalizedRow.gsttreatment === 'business_gst' || normalizedRow.companyname) ? 'B2B' : 'B2C',
        companyName: normalizedRow.companyname,
        address: `${normalizedRow.billingaddress || ''}, ${normalizedRow.billingcity || ''}, ${normalizedRow.billingstate || ''} - ${normalizedRow.billingcode || ''}`.replace(/^,|,$/g, '').trim(),
        gstNumber: normalizedRow.gstidentificationnumbergstin,
        role: 'customer',
        vehicles: [], // Vehicles are not in this sample CSV
        portalStatus: 'Enabled',
    } as Partial<Customer>;
}


export default function CustomersPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { employees, loading } = useEmployee();
    
    // Filter to get only customers from the employees list
    const customers = employees.filter(e => e.role === 'customer') as Customer[];
    
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
    const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);


    const handleDownload = () => {
        const dataToExport = customers.map(c => ({...c, vehicles: Array.isArray(c.vehicles) ? c.vehicles.join(', ') : ''}));
        
        if (dataToExport.length === 0) {
            alert("No data available to download.");
            return;
        }

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadSample = () => {
        const sampleData = [{
            'Created Time': '2025-01-15T10:00:00Z',
            'Last Modified Time': '2025-01-15T10:00:00Z',
            'Display Name': 'Sample Corp',
            'Customer Number': '',
            'Company Name': 'Sample Corp',
            'Salutation': 'Mr.',
            'First Name': 'John',
            'Last Name': 'Doe',
            'Phone': '9876543210',
            'Currency Code': 'INR',
            'Notes': 'This is a sample customer.',
            'Website': 'www.sample.com',
            'Status': 'Active',
            'Opening Balance': 0,
            'Opening Balance Exchange Rate': 1,
            'Branch ID': 'BRANCH01',
            'Branch Name': 'Main Branch',
            'Bank Account Payment': '',
            'Portal Enabled': 'true',
            'Credit Limit': 50000,
            'Customer Sub Type': '',
            'Billing Attention': 'John Doe',
            'Billing Address': '123 Sample St',
            'Billing Street2': 'Apt 4B',
            'Billing City': 'Sampleville',
            'Billing State': 'State',
            'Billing Country': 'India',
            'Billing County': '',
            'Billing Code': '110001',
            'Billing Phone': '9876543210',
            'Billing Fax': '',
            'Shipping Attention': 'John Doe',
            'Shipping Address': '123 Sample St',
            'Shipping Street2': 'Apt 4B',
            'Shipping City': 'Sampleville',
            'Shipping State': 'State',
            'Shipping Country': 'India',
            'Shipping County': '',
            'Shipping Code': '110001',
            'Shipping Phone': '9876543210',
            'Shipping Fax': '',
            'Skype Identity': '',
            'Facebook': '',
            'Twitter': '',
            'Department': '',
            'Designation': '',
            'Price List': 'Standard',
            'Payment Terms': 'Net 30',
            'Payment Terms Label': 'Net 30 Days',
            'GST Treatment': 'business_gst',
            'GST Identification Number (GSTIN)': '29GGGGG1314B9Z2',
            'Last Sync Time': '',
            'Owner Name': 'Admin',
            'Primary Contact ID': '',
            'EmailID': 'sample.customer@example.com',
            'MobilePhone': '9876543210',
            'Contact ID': '',
            'Contact Name': 'John Doe',
            'Contact Type': 'Primary',
            'Place Of Contact': 'Delhi',
            'Place of Contact(With State Code)': 'DL',
            'Taxable': 'true',
            'TaxID': '',
            'Tax Name': 'GST18',
            'Tax Percentage': 18,
            'Exemption Reason': '',
            'Contact Address ID': '',
            'Source': 'Web'
        }];
        const csv = Papa.unparse(sampleData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample-customer-import.csv');
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
                const headers = results.meta.fields || [];
                
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
                description: `Data for ${dataToImport.length} customers has been submitted for processing.`,
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


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Customers"
        description="Manage your B2B and B2C customers."
      >
        <Button variant="outline" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2" />
            Download CSV
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Add Customer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new customer profile.
                    </DialogDescription>
                </DialogHeader>
                <AddCustomerForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
        </Dialog>

      </PageHeader>
      
        <Card>
            <CardHeader>
                <CardTitle>Bulk Upload Customers</CardTitle>
                <CardDescription>Upload a CSV file to add multiple customers at once.</CardDescription>
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
        <CustomerList customers={customers} />
      )}
    </div>
  );
}
