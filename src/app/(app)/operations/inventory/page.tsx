
'use client';
import React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InventoryPart, ServiceItem } from '@/lib/inventory-data';
import { PartsTable } from '@/components/inventory/parts-table';
import { ServicesTable } from '@/components/inventory/services-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, AlertTriangle, FileCheck, Loader2, Download, FileUp, CircleHelp, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AddInventoryItemForm } from '@/components/inventory/add-inventory-item-form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventory } from '@/context/InventoryContext';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { partsColumns } from '@/components/inventory/parts-columns';
import { servicesColumns } from '@/components/inventory/services-columns';
import { batchImportData } from '@/app/actions/data-ingestion';
import * as XLSX from 'xlsx';
import { AdjustStockDialog } from '@/components/inventory/adjust-stock-dialog';



type DuplicateHandling = 'skip' | 'overwrite';

function mapRowToDocument(row: Record<string, any>): InventoryPart {
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
        normalizedRow[key.trim().replace(/[^a-z0-9.]/gi, '')] = row[key];
    }

    const validCategories = ['Electrical', 'Mechanical', 'Battery', 'Chassis', 'Body'];
    let category = normalizedRow.category || normalizedRow.categoryname;
    if (!category || !validCategories.includes(category)) {
        category = 'Mechanical';
    }

    return {
        id: normalizedRow.id ?? '',
        name: normalizedRow.name ?? '',
        partNumber: normalizedRow.partNumber ?? '',
        hsnSacCode: normalizedRow.hsnSacCode ?? '',
        price: parseFloat(normalizedRow.price) || 0,
        purchasePrice: parseFloat(normalizedRow.purchasePrice) || 0,
        stock: parseInt(normalizedRow.stock, 10) || 0,
        minStockLevel: parseInt(normalizedRow.minStockLevel, 10) || 0,
        category: normalizedRow.category ?? '' as InventoryPart['category'],
        brand: normalizedRow.brand || 'N/A',
        manufacturer: normalizedRow.manufacturer || 'N/A',
        supplier: normalizedRow.supplier || 'N/A',
        itemType: 'Goods',
        taxable: normalizedRow.taxable?.toLowerCase() === 'yes',
        gstRate: parseInt(normalizedRow.gstRate) || 0,
        description: normalizedRow.description ?? '',
        usageUnit: normalizedRow.usageUnit ?? 'NA',
        purchaseAccount: normalizedRow.purchaseAccount ?? '',
        purchaseAccountCode: normalizedRow.purchaseAccountCode ?? '',
        inventoryAccount: normalizedRow.inventoryAccount ?? '',
        inventoryAccountCode: normalizedRow.inventoryAccountCode ?? ''
    };
}


export default function InventoryPage() {
    const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
    const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
    const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState<InventoryPart | ServiceItem | undefined>(undefined);

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
    const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>('skip');
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);


    const { parts, services, batchAddOrUpdateParts, loading } = useInventory();

    const { toast } = useToast();    

    const partSKUMap = useMemo(() => {
        const map = new Map<string, InventoryPart>();
        parts.forEach(part => {
            if (part.partNumber) {
                map.set(part.partNumber, part);
            }
        });
        return map;
    }, [parts]);


    const kpiData = useMemo(() => {
        if (parts.length === 0) return { totalValue: 0, lowStockItems: 0 };

        const totalValue = parts.reduce((sum, part) => {
            const price = part.price || 0;
            const stock = part.stock || 0;
            return sum + (price * stock);
        }, 0);

        const lowStockItems = parts.filter(part => {
            const stock = part.stock || 0;
            const minStock = part.minStockLevel || 0;
            return minStock > 0 && stock < minStock;
        }).length;

        return { totalValue, lowStockItems };
    }, [parts]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setParsedData([]);
        setFile(null);
        if (event.target.files && event.target.files.length > 0) {
            const uploadedFile = event.target.files[0];
            const fileType = uploadedFile.type;
            if (fileType !== 'text/csv' && !fileType.includes('spreadsheetml') && !fileType.includes('excel')) {
                toast({
                    title: "Invalid File Type",
                    description: "Please upload a valid CSV or XLS file.",
                    variant: "destructive"
                });
                return;
            }
            setFile(uploadedFile);
            parseFile(uploadedFile);
        }
    };

    const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '');

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
                setIsPreviewDialogOpen(true);

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

    const handleImport = async () => {
        setIsImporting(true);
        try {
            const dataToImport = parsedData.map(mapRowToDocument).filter(d => d.name && d.partNumber);

            if (dataToImport.length > 0) {
                await batchImportData('inventoryParts', dataToImport);
            }

            toast({
                title: "Import Successful",
                description: `Data for ${dataToImport.length} inventory items has been submitted for processing.`,
            });

        } catch (error) {
            console.error("Import failed:", error);
            toast({
                title: "Import Failed",
                description: "An error occurred during the import. Please check the console for details.",
                variant: "destructive",
            });
        } finally {
            setIsImporting(false);
            setParsedData([]);
            setUploadHeaders([]);
            setFile(null);
            setIsPreviewDialogOpen(false);
            const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
            if (fileInput) fileInput.value = "";
            handleDiscardImport();
        }
    };

    const handleDownloadSample = () => {
        const sampleData: InventoryPart[] = [
            {
                id: "INV-001",
                partNumber: "BT-1001",
                name: "Lithium-Ion Battery Pack 12V 20Ah",
                brand: "PowerMax",
                manufacturer: "PowerMax Industries Pvt. Ltd.",
                description: "High-performance 12V lithium-ion battery pack suitable for electric scooters.",
                category: "Battery",
                stock: 50,
                minStockLevel: 10,
                price: 4200,
                gstRate: 18,
                hsnSacCode: "85076000",
                supplier: "GreenTech Supplies",
                purchasePrice: 3600,
                purchaseAccount: "Battery Purchases",
                purchaseAccountCode: "5021",
                inventoryAccount: "Battery Inventory",
                inventoryAccountCode: "3010",
                itemType: "Goods",
                usageUnit: "pcs",
                taxable: "yes",
            }
        ];
        const csv = Papa.unparse(sampleData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample-inventory-import.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditPart = (part: InventoryPart) => {
        setSelectedPart(part);
        setEditItemDialogOpen(true);
    };
    const handleEditService = (service: ServiceItem) => {
        setSelectedPart(service);
        setEditItemDialogOpen(true);
    };

    const handleAdjustStock = (part: InventoryPart) => {
        setSelectedPart(part);
        setAdjustStockDialogOpen(true);
    };

    const handleFormSuccess = () => {
        setAddItemDialogOpen(false);
        setEditItemDialogOpen(false);
        setAdjustStockDialogOpen(false);

        setSelectedPart(undefined);
    }

    const handleDiscardImport = () => {
        setIsImporting(false);
        setParsedData([]);
        setUploadHeaders([]);
        setFile(null);
        setExpandedRowIndex(null);
        setIsPreviewDialogOpen(false);
        const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    }

    const handleDownload = (data: any[], filename: string) => {
        const dataToParse = Array.isArray(data) ? data : [];
        if (dataToParse.length === 0) {
            alert("No data available to download.");
            return;
        }
        const csv = Papa.unparse(dataToParse);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

     const handleRowClick = (index: number) => {
        setExpandedRowIndex(expandedRowIndex === index ? null : index);
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="Inventory Management"
                description="Manage your parts inventory and service price list."
            >
                <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Add New Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Inventory Item</DialogTitle>
                            <DialogDescription>
                                Fill in the details to add a new part to your inventory.
                            </DialogDescription>
                        </DialogHeader>
                        <AddInventoryItemForm onSuccess={handleFormSuccess} />
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><span className="font-code">INR ₹{kpiData.totalValue.toLocaleString()}</span></div>
                        <p className="text-xs text-muted-foreground">
                            Based on current stock and prices.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Items Low on Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.lowStockItems}</div>
                        <p className="text-xs text-muted-foreground">
                            Items below their minimum stock level.
                        </p>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Bulk Upload Parts</CardTitle>
                        <CardDescription>Upload a CSV file to add or update multiple parts at once.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Sample CSV
                        </Button>
                        <div className="flex items-center gap-2">
                            <Input id="bulk-upload-input" type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="max-w-xs" />
                        </div>
                    </CardContent>
                </Card>
            </div>


            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-max h-full flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Upload Preview & Confirmation</DialogTitle>
                        <DialogDescription>Review the {parsedData.length} records before importing.</DialogDescription>
                    </DialogHeader>
                    <div className=" mt-4 max-h-[85%]">
                        {/* <div className="mb-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Handle Duplicates</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-5 w-5"><CircleHelp className="h-4 w-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Duplicates are identified by the 'Part Number' / 'SKU' column.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <RadioGroup defaultValue="skip" value={duplicateHandling} onValueChange={(v: DuplicateHandling) => setDuplicateHandling(v)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="skip" id="skip" />
                                    <Label htmlFor="skip">Skip duplicates</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="overwrite" id="overwrite" />
                                    <Label htmlFor="overwrite">Overwrite existing items</Label>
                                </div>
                            </RadioGroup>
                        </div> */}
                        <div className="overflow-auto border rounded-md h-full ">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        {uploadHeaders.map(header => <TableHead key={header} className="p-3" >{header}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((row, index) => (
                                        <React.Fragment key={index}>
                                    <TableRow onClick={() => handleRowClick(index)} className="cursor-pointer">
                                        {uploadHeaders.map(header => (
                                            <TableCell 
                                                key={header} 
                                                className="py-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                                            >
                                                {String(row[header])}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {expandedRowIndex === index && (
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={uploadHeaders.length} className="p-0">
                                                 <div className="p-4 grid max-w-screen-lg grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-4 gap-y-2">
                                                    {uploadHeaders.map(header => (
                                                        <div key={header} className="grid grid-cols-[1fr,2fr] items-start">
                                                            <span className=" font-semibold text-muted-foreground pr-2">{header}:</span>
                                                            <span className=" break-words">{String(row[header])}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                  </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-end mt-6 gap-2">
                            <Button variant={"destructive"} onClick={handleDiscardImport} >
                                <X className='h-4 w-4 mr-2' />
                                Discard
                            </Button>
                            <Button onClick={handleImport} disabled={isImporting}>
                                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                                Confirm & Import
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="parts">
                <TabsList>
                    <TabsTrigger value="parts">Parts Inventory</TabsTrigger>
                    <TabsTrigger value="services">Service Price List</TabsTrigger>
                </TabsList>
                <TabsContent value="parts">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Parts</CardTitle>
                                <CardDescription>Manage stock levels and pricing for spare parts.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <PartsTable columns={partsColumns} data={parts} onEdit={handleEditPart} onAdjustStock={handleAdjustStock} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="services">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Services</CardTitle>
                                <CardDescription>Manage the list of services you offer and their prices.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <ServicesTable columns={servicesColumns} data={services} onEdit={handleEditService} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>


            <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Inventory Item</DialogTitle>
                        <DialogDescription>
                            Update the details for the selected part.
                        </DialogDescription>
                    </DialogHeader>
                    <AddInventoryItemForm
                        item={selectedPart}
                        onSuccess={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={adjustStockDialogOpen} onOpenChange={setAdjustStockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Stock</DialogTitle>
                    </DialogHeader>
                    {selectedPart?.itemType === 'Goods' && <AdjustStockDialog part={selectedPart as InventoryPart} onSuccess={handleFormSuccess} />}
                </DialogContent>
            </Dialog>

        </div>
    );
}
