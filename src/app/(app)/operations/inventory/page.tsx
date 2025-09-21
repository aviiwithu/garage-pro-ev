
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InventoryPart, ServiceItem } from '@/lib/inventory-data';
import { PartsTable } from '@/components/inventory/parts-table';
import { ServicesTable } from '@/components/inventory/services-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, AlertTriangle, FileCheck, Loader2, Download, FileUp, CircleHelp } from 'lucide-react';
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


type DuplicateHandling = 'skip' | 'overwrite';

function mapRowToDocument(row: Record<string, any>): Partial<InventoryPart> {
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
        normalizedRow[key.trim().toLowerCase().replace(/[^a-z0-9]/gi, '')] = row[key];
    }
    
    const validCategories = ['Electrical', 'Mechanical', 'Battery', 'Chassis', 'Body'];
    let category = normalizedRow.category || normalizedRow.categoryname;
    if (!category || !validCategories.includes(category)) {
        category = 'Mechanical';
    }

    return {
        name: normalizedRow.itemname || normalizedRow.name || normalizedRow.partname,
        partNumber: normalizedRow.sku || normalizedRow.partnumber || normalizedRow.itemid,
        hsnSacCode: normalizedRow.hsnsac,
        price: parseFloat(normalizedRow.rate) || 0,
        purchasePrice: parseFloat(normalizedRow.purchaserate) || 0,
        stock: parseInt(normalizedRow.openingstock, 10) || 0,
        minStockLevel: parseInt(normalizedRow.reorderpoint, 10) || 0,
        category: category as InventoryPart['category'],
        brand: normalizedRow.brand || 'N/A',
        supplier: normalizedRow.vendor || 'N/A',
        itemType: 'Goods',
        taxable: normalizedRow.taxable?.toLowerCase() === 'yes',
        gstRate: parseInt(normalizedRow.intrastatetaxrate) || 0
    };
}


export default function InventoryPage() {
    const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
    const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState<InventoryPart | undefined>(undefined);

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
    const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>('skip');
    
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
        Papa.parse(fileToParse, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                if (results.errors.length > 0) {
                    toast({ title: "Parsing Error", description: `Error: ${results.errors[0].message}`, variant: "destructive" });
                    return;
                }

                const data = results.data as Record<string, any>[];
                const headers = results.meta.fields || [];
                const normalizedHeaders = headers.map(normalizeHeader);

                const headerMap: Record<string, string[]> = {
                    name: ['itemname', 'name', 'partname'],
                    partNumber: ['sku', 'partnumber', 'itemid'],
                };
                
                const missingHeaders = Object.keys(headerMap).filter(reqHeader => {
                    return !headerMap[reqHeader].some(v => normalizedHeaders.includes(v));
                });

                if (missingHeaders.length > 0) {
                     toast({ title: "Missing Required Headers", description: `Your file must contain columns for at least: ${missingHeaders.join(', ')}.`, variant: "destructive" });
                    return;
                }

                setParsedData(data);
                setUploadHeaders(headers);
                toast({ title: "File Parsed Successfully", description: `Found ${data.length} records. Review the data below.` });
            },
            error: (error) => {
                toast({ title: "Parsing Error", description: `Error: ${error.message}`, variant: "destructive" });
            }
        });
    };
    
    const handleImport = async () => {
        setIsImporting(true);
        try {
            const dataToImport = parsedData.map(mapRowToDocument).filter(d => d.name && d.partNumber);
            
            if(dataToImport.length > 0) {
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
            const fileInput = document.getElementById('bulk-upload-input') as HTMLInputElement;
            if(fileInput) fileInput.value = "";
        }
    };
    
    const handleDownloadSample = () => {
        const sampleData = [
            {
                "Item ID": "",
                "Item Name": "12V Auxiliary Battery",
                "SKU": "BT-12V-GPR",
                "HSN/SAC": "85071000",
                "Description": "Standard 12V auxiliary battery for EV systems.",
                "Rate": 7500,
                "Account": "",
                "Account Code": "",
                "Taxable": "Yes",
                "Exemption Reason": "",
                "Taxability Type": "Taxable",
                "Product Type": "Goods",
                "Intra State Tax Name": "GST18",
                "Intra State Tax Rate": 18,
                "Inter State Tax Name": "IGST18",
                "Inter State Tax Rate": 18,
                "Inter State Tax Type": "GST",
                "Source": "Local",
                "Reference ID": "",
                "Last Sync Time": "",
                "Status": "Active",
                "Usage unit": "Nos",
                "Purchase Rate": 6200,
                "Purchase Account": "Cost of Goods Sold",
                "Purchase Account Code": "5001",
                "Inventory Account": "Inventory Asset",
                "Inventory Account Code": "1401",
                "Inventory Valuation Method": "FIFO",
                "Reorder Point": 10,
                "Vendor": "EV Parts Co.",
                "Opening Stock": 50,
                "Opening Stock Value": 310000,
                "Stock On Hand": 50,
                "Item Type": "Inventory",
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

    const handleFormSuccess = () => {
        setAddItemDialogOpen(false);
        setEditItemDialogOpen(false);
        setSelectedPart(undefined);
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
                    <Download className="mr-2 h-4 w-4"/>
                    Download Sample CSV
                </Button>
               <div className="flex items-center gap-2">
                 <Input id="bulk-upload-input" type="file" accept=".csv" onChange={handleFileChange} className="max-w-xs" />
               </div>
            </CardContent>
        </Card>
      </div>
      
      {parsedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Preview & Confirmation</CardTitle>
              <CardDescription>Review the data before importing. All rows from the file are shown.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-2">
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
              </div>
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
                    Confirm & Import {parsedData.length} items
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

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
                        <PartsTable columns={partsColumns} data={parts} onEdit={handleEditPart} />
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
                        <ServicesTable columns={servicesColumns} data={services} />
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
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

    </div>
  );
}
