'use client';

import { Complaint, ComplaintStatus } from '@/lib/complaint-data';
import { InventoryPart, ServiceItem } from '@/lib/inventory-data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, CheckCircle, PlusCircle, Trash2, Send, Check, Play, Flag, FileText, UserCog, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { useComplaint } from '@/context/ComplaintContext';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/context/InventoryContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AssignTechnicianDialog } from './assign-technician-dialog';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';

interface JobCardProps {
  complaint: Complaint;
}

export function JobCard({ complaint: initialComplaint }: JobCardProps) {
  const { complaints, addEstimatedItem, addActualItem, approveEstimate, removeEstimatedItem, removeActualItem, updateComplaintStatus, closeAndInvoiceComplaint } = useComplaint();
  const { parts: inventoryParts, services: serviceItems } = useInventory();
  
  const complaint = complaints.find(c => c.id === initialComplaint.id) || initialComplaint;
  
  const [itemToAdd, setItemToAdd] = useState('');
  const [itemType, setItemType] = useState<'part' | 'service'>('part');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);


  const handleAddItem = () => {
    if (!itemToAdd) return;

    const isEstimateStage = ['Technician Assigned', 'Estimate Shared'].includes(complaint.status);
    
    let item: (InventoryPart | ServiceItem) & { gstRate?: number } | undefined;
    if (itemType === 'part') {
        item = inventoryParts.find(p => p.id === itemToAdd);
    } else {
        item = serviceItems.find(s => s.id === itemToAdd);
    }
    
    if (item) {
        if (!item.gstRate) item.gstRate = 0; // Ensure GST rate exists
        if (isEstimateStage) {
            addEstimatedItem(complaint.id, item, itemType);
        } else {
            addActualItem(complaint.id, item, itemType);
        }
    }
    setItemToAdd('');
  };
  
  const handleApproveEstimate = () => {
    approveEstimate(complaint.id);
  };
  
  const handleRemoveItem = (item: InventoryPart | ServiceItem, type: 'part' | 'service') => {
    const isEstimateStage = ['Technician Assigned', 'Estimate Shared'].includes(complaint.status);
     if (isEstimateStage) {
       removeEstimatedItem(complaint.id, item, type);
     } else {
       removeActualItem(complaint.id, item, type);
     }
  }

  const handlePrint = () => {
    window.print();
  }

  const handleCloseAndInvoice = () => {
    closeAndInvoiceComplaint(complaint.id);
  };

  const isEstimationPhase = ['Technician Assigned', 'Estimate Shared'].includes(complaint.status);
  const isWorkPhase = ['Estimate Approved', 'In Progress', 'Resolved', 'Closed'].includes(complaint.status);
  
  const items = isEstimationPhase ? complaint.estimatedItems : complaint.actualItems;
  const subtotal = (items?.parts?.reduce((sum, part) => sum + part.price, 0) || 0) + (items?.services?.reduce((sum, service) => sum + service.price, 0) || 0);
  const totalTax = (items?.parts?.reduce((sum, part) => sum + (part.price * (part.gstRate || 0) / 100), 0) || 0) + (items?.services?.reduce((sum, service) => sum + (service.price * (service.gstRate || 0) / 100), 0) || 0);
  const grandTotal = subtotal + totalTax;


  return (
    <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 pr-6 -mr-6">
            <div className="p-6 bg-white rounded-lg shadow-md print:shadow-none">
            <div className="flex justify-between items-start mb-4">
                <div>
                <h2 className="text-2xl font-bold font-headline text-primary">GaragePRO</h2>
                <p className="text-muted-foreground">123 Auto Lane, Mechville, 12345</p>
                </div>
                <div className="text-right">
                <h3 className="text-xl font-semibold">Job Card / Invoice</h3>
                <p className="text-muted-foreground">Ticket ID: {complaint.id}</p>
                </div>
            </div>

            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                <h4 className="font-semibold">Customer Details</h4>
                <p>{complaint.customerName}</p>
                </div>
                <div className="text-right">
                <h4 className="font-semibold">Vehicle Details</h4>
                <p>{(complaint as any).vehicleModel} - {complaint.vehicleNumber}</p>
                </div>
            </div>
            
            <div>
                <h4 className="font-semibold">Issue Reported</h4>
                <p className="text-muted-foreground p-2 bg-secondary rounded-md">{complaint.issue}</p>
            </div>
            
            {complaint.attachmentUrls && complaint.attachmentUrls.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-semibold">Attachments</h4>
                    <div className="flex flex-col gap-2 mt-2">
                        {complaint.attachmentUrls.map((url, index) => (
                            <Button asChild variant="outline" className="justify-start" key={url}>
                                <Link href={url} target="_blank" rel="noopener noreferrer">
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    Attachment {index + 1}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <Separator className="my-4" />

            {(isEstimationPhase || (isWorkPhase && complaint.status !== 'Closed')) && (
                <div className="my-6 p-4 border rounded-lg print:hidden">
                    <h4 className="font-semibold mb-2">
                        {isEstimationPhase ? 'Add Items to Estimate' : 'Add Parts/Services Used'}
                    </h4>
                    <div className="flex gap-2">
                        <Select value={itemType} onValueChange={(v: 'part' | 'service') => { setItemType(v); setItemToAdd('')}}>
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="part">Part</SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={itemToAdd} onValueChange={setItemToAdd}>
                            <SelectTrigger><SelectValue placeholder={`Select a ${itemType}...`} /></SelectTrigger>
                            <SelectContent>
                                {itemType === 'part' 
                                    ? inventoryParts.map(p => <SelectItem key={p.id} value={p.id!}>{p.name} (<span className="font-sans">INR </span><span className="font-sans">₹</span><span className="font-code">{p.price.toFixed(2)}</span>)</SelectItem>)
                                    : serviceItems.map(s => <SelectItem key={s.id} value={s.id!}>{s.name} (<span className="font-sans">INR </span><span className="font-sans">₹</span><span className="font-code">{s.price.toFixed(2)}</span>)</SelectItem>)
                                }
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddItem}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                    </div>
                </div>
            )}


            <div>
                <h4 className="font-semibold mb-2">{isEstimationPhase ? 'Estimated Services & Parts' : 'Services Performed & Parts Used'}</h4>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>HSN/SAC</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>GST</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            {(isEstimationPhase || (isWorkPhase && complaint.status !== 'Closed' && complaint.status !== 'Resolved')) && <TableHead className="text-right print:hidden">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items?.services?.map((service, index) => (
                            <TableRow key={`service-${service.name}-${index}`}>
                                <TableCell>{service.name}</TableCell>
                                <TableCell>{service.hsnSacCode}</TableCell>
                                <TableCell><Badge variant="secondary">Service</Badge></TableCell>
                                <TableCell>{service.gstRate || 0}%</TableCell>
                                <TableCell className="text-right">
                                    <span className="font-sans">INR </span>
                                    <span className="font-sans">₹</span><span className="font-code">{service.price.toFixed(2)}</span>
                                </TableCell>
                                {(isEstimationPhase || (isWorkPhase && complaint.status !== 'Closed' && complaint.status !== 'Resolved')) && (
                                <TableCell className="text-right print:hidden">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(service, 'service')}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {items?.parts?.map((part, index) => (
                            <TableRow key={`part-${part.name}-${index}`}>
                                <TableCell>{part.name}</TableCell>
                                <TableCell>{part.hsnSacCode}</TableCell>
                                <TableCell><Badge variant="outline">Part</Badge></TableCell>
                                <TableCell>{part.gstRate || 0}%</TableCell>
                                <TableCell className="text-right">
                                    <span className="font-sans">INR </span>
                                    <span className="font-sans">₹</span><span className="font-code">{part.price.toFixed(2)}</span>
                                </TableCell>
                                {(isEstimationPhase || (isWorkPhase && complaint.status !== 'Closed' && complaint.status !== 'Resolved')) && (
                                <TableCell className="text-right print:hidden">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(part, 'part')}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {(!items || (!items.services?.length && !items.parts?.length)) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No items added yet.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between items-center">
                <p className="text-sm">Technician: {complaint.assignedTo}</p>
                <div className="w-full max-w-xs space-y-2 text-right">
                    <div className="flex justify-between"><span>Subtotal</span><span><span className="font-sans">INR </span><span className="font-sans">₹</span><span className="font-code">{subtotal.toFixed(2)}</span></span></div>
                    <div className="flex justify-between"><span>CGST ({totalTax > 0 ? ((totalTax / 2) / subtotal * 100).toFixed(1) : 0}%)</span><span><span className="font-sans">INR </span><span className="font-sans">₹</span><span className="font-code">{(totalTax/2).toFixed(2)}</span></span></div>
                    <div className="flex justify-between"><span>SGST ({totalTax > 0 ? ((totalTax / 2) / subtotal * 100).toFixed(1) : 0}%)</span><span><span className="font-sans">INR </span><span className="font-sans">₹</span><span className="font-code">{(totalTax/2).toFixed(2)}</span></span></div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg"><p>Grand Total</p><p><span className="font-sans">INR </span><span className="font-sans">₹</span><span className="font-code">{grandTotal.toFixed(2)}</span></p></div>
                </div>
            </div>
            
            <Separator className="my-4" />

            <div>
                <h4 className="font-semibold mb-2">Service History</h4>
                <ul className="space-y-2">
                    {complaint.statusHistory.map((historyItem, index) => (
                        <li key={index} className="flex items-center gap-4">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="font-medium">{historyItem.status}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(historyItem.timestamp), "PPP p")}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            </div>
        </ScrollArea>
        <div className="mt-auto pt-6 flex justify-end gap-2 print:hidden border-t">
            {complaint.status === 'Open' && (
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserCog className="mr-2 h-4 w-4" />
                            Assign Technician
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Technician</DialogTitle>
                            <DialogDescription>
                                Choose an available technician to assign to this service ticket.
                            </DialogDescription>
                        </DialogHeader>
                        <AssignTechnicianDialog complaint={complaint} onSuccess={() => setAssignDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            )}
            {complaint.status === 'Technician Assigned' && (
                <Button onClick={() => updateComplaintStatus(complaint.id, 'Estimate Shared')}>
                    <Send className="mr-2 h-4 w-4" />
                    Share Estimate
                </Button>
            )}
            {complaint.status === 'Estimate Shared' && (
                <Button onClick={handleApproveEstimate} variant="outline">
                    <Check className="mr-2 h-4 w-4" />
                    Simulate Customer Approval
                </Button>
            )}
            {complaint.status === 'Estimate Approved' && (
                <Button onClick={() => updateComplaintStatus(complaint.id, 'In Progress')}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Work
                </Button>
            )}
            {complaint.status === 'In Progress' && (
                <Button onClick={() => updateComplaintStatus(complaint.id, 'Resolved')}>
                    <Flag className="mr-2 h-4 w-4" />
                Mark as Resolved
                </Button>
            )}
            {complaint.status === 'Resolved' && (
                <Button onClick={handleCloseAndInvoice}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice &amp; Close
                </Button>
            )}
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print / Save as PDF
            </Button>
        </div>
    </div>
  );
}
