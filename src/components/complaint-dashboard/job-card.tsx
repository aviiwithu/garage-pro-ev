
'use client';

import { Complaint } from '@/lib/complaint-data';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '@/context/AuthProvider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createOrder, verifySignature } from '@/services/payment-gateway';
import { useToast } from '@/hooks/use-toast';

interface JobCardProps {
    complaint: Complaint;
}

export function JobCard({ complaint: initialComplaint }: JobCardProps) {
    const { complaints, addEstimatedItem, addActualItem, approveEstimate, removeEstimatedItem, removeActualItem, updateComplaintStatus, closeAndInvoiceComplaint } = useComplaint();
    const { parts: inventoryParts, services: serviceItems } = useInventory();
    const { role, user } = useAuth();
    const { toast } = useToast();

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
        const input = document.getElementById('printable-job-card');
        if (input) {
            html2canvas(input, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const width = pdfWidth;
                const height = width / ratio;

                pdf.addImage(imgData, 'PNG', 0, 0, width, height > pdfHeight ? pdfHeight : height);
                pdf.save(`JobCard-${complaint.id.substring(0, 6)}.pdf`);
            });
        }
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

    const handlePayment = async () => {
        try {
            const order = await createOrder(grandTotal, "invoice123");
            const checkoutOptions = {
                key: process.env.NEXT_PUBLIC_RZP_KEY,
                amount: order.amount,
                currency: order.currency,
                name: "GaragePRO",
                description: "Invoice for Ticket #" + complaint.id,
                order_id: order.id,
                handler: async function (response: any) {
                    const razorpay_order_id = response.razorpay_order_id;
                    const razorpay_payment_id = response.razorpay_payment_id;
                    const razorpay_signature = response.razorpay_signature;
                    const isSignatureValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
                    if (isSignatureValid) {
                        toast({
                            title: 'Payment successful',
                            description: `Payment completed for the amount INR ${grandTotal}`,
                            variant: 'default',
                        });

                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone
                },
                notes: {
                    address: "Razorpay Corporate Office"
                },
                theme: {
                    color: "#3399cc"
                }
            }

            var rzp1 = new (window as any).Razorpay(checkoutOptions);
             

            rzp1.on('payment.failed', function (response: any) {
                console.log("payment.failed", response);
                // toast({
                //         title: 'Payment failed',
                //         description: "Payment not completed for the flow",
                //         variant: 'destructive',
                //     });

            });
            rzp1.open();

        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="flex flex-col h-full bg-muted/20">
            <ScrollArea className="flex-1 -mr-6">
                <div id="printable-job-card" className="p-4 pr-6 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4 print:hidden">
                        <div>
                            <h2 className="text-2xl font-bold font-headline text-primary">GaragePRO</h2>
                            <p className="text-muted-foreground">123 Auto Lane, Mechville, 12345</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xl font-semibold">Job Card</h3>
                            <p className="text-muted-foreground">{complaint.id}</p>
                        </div>
                    </div>

                    {/* Customer and Vehicle Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer & Vehicle Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Customer</p>
                                <p className="font-semibold">{complaint.customerName}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Vehicle Reg. No.</p>
                                <p className="font-semibold">{complaint.vehicleNumber}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Vehicle Model</p>
                                <p className="font-semibold">{(complaint as any).vehicleModel || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Technician Assigned</p>
                                <p className="font-semibold">{complaint.assignedTo}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Issue Details */}
                    <Card>
                        <CardHeader><CardTitle>Issue Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Issue Reported</h4>
                                <p className="text-muted-foreground mt-1">{complaint.issue}</p>
                            </div>
                            {complaint.attachmentUrls && complaint.attachmentUrls.length > 0 && (
                                <div>
                                    <h4 className="font-semibold">Attachments</h4>
                                    <div className="flex flex-col gap-2 mt-2">
                                        {complaint.attachmentUrls.map((url, index) => (
                                            <Button asChild variant="outline" className="justify-start w-fit" key={url}>
                                                <Link href={url} target="_blank" rel="noopener noreferrer">
                                                    <Paperclip className="mr-2 h-4 w-4" />
                                                    Attachment {index + 1}
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items and Costing */}
                    {
                        complaint.status !== "Open" &&
                        <Card>
                            <CardHeader>
                                <CardTitle>{isEstimationPhase ? 'Estimated Cost' : 'Final Bill'}</CardTitle>
                                <CardDescription>
                                    {(isEstimationPhase && role !== "customer") ? 'Add or remove items to generate the cost estimate.' : 'Parts and services used for this job.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {role !== "customer" && (isEstimationPhase) && (
                                    <div className="my-4 p-4 border rounded-lg print:hidden bg-background">
                                        <h4 className="font-semibold mb-2">
                                            {isEstimationPhase ? 'Add Items to Estimate' : 'Add Parts/Services Used'}
                                        </h4>
                                        <div className="flex gap-2">
                                            <Select value={itemType} onValueChange={(v: 'part' | 'service') => { setItemType(v); setItemToAdd('') }}>
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
                                                        ? inventoryParts.map(p => <SelectItem key={p.id} value={p.id!}>{p.name} (₹{p.price.toFixed(2)})</SelectItem>)
                                                        : serviceItems.map(s => <SelectItem key={s.id} value={s.id!}>{s.name} (₹{s.price.toFixed(2)})</SelectItem>)
                                                    }
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={handleAddItem}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                                        </div>
                                    </div>
                                )}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>GST</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                                {role !== "customer" && (isEstimationPhase) && <TableHead className="text-right print:hidden">Actions</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items?.services?.map((service, index) => (
                                                <TableRow key={`service-${service.name}-${index}`}>
                                                    <TableCell>{service.name}</TableCell>
                                                    <TableCell><Badge variant="secondary">Service</Badge></TableCell>
                                                    <TableCell>{service.gstRate || 0}%</TableCell>
                                                    <TableCell className="text-right font-code">₹{service.price.toFixed(2)}</TableCell>
                                                    {role !== "customer" && (isEstimationPhase) && (
                                                        <TableCell className="text-right print:hidden">
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(service, 'service')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                            {items?.parts?.map((part, index) => (
                                                <TableRow key={`part-${part.name}-${index}`}>
                                                    <TableCell>{part.name}</TableCell>
                                                    <TableCell><Badge variant="outline">Part</Badge></TableCell>
                                                    <TableCell>{part.gstRate || 0}%</TableCell>
                                                    <TableCell className="text-right font-code">₹{part.price.toFixed(2)}</TableCell>
                                                    {role !== "customer" && (isEstimationPhase) && (
                                                        <TableCell className="text-right print:hidden">
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(part, 'part')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                            {(!items || (!items.services?.length && !items.parts?.length)) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground h-24">No items added yet.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="w-full max-w-sm space-y-2 ml-auto text-right text-sm">
                                    <div className="flex justify-between"><span>Subtotal</span><span className="font-code">₹{subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Total Tax</span><span className="font-code">₹{totalTax.toFixed(2)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg"><p>Grand Total</p><p className="font-code">₹{grandTotal.toFixed(2)}</p></div>
                                </div>
                            </CardFooter>
                        </Card>
                    }

                    {/* Status History */}
                    <Card>
                        <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {complaint.statusHistory.map((historyItem, index) => (
                                    <li key={index} className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="bg-primary rounded-full h-8 w-8 flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5 text-primary-foreground" />
                                            </div>
                                            {index < complaint.statusHistory.length - 1 && <div className="w-px h-8 bg-border"></div>}
                                        </div>
                                        <div>
                                            <p className="font-medium">{historyItem.status}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(historyItem.timestamp), "PPP p")}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
            <div className="mt-auto pt-4 flex justify-end gap-2 print:hidden border-t bg-background p-4 -ml-4 -mr-6 -mb-6 rounded-b-lg">
                {role === "admin" && complaint.status === 'Open' && (
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
                {role !== "customer" && complaint.status === 'Technician Assigned' && (complaint.estimatedItems.parts.length > 0 || complaint.estimatedItems.services.length > 0) && (
                    <Button onClick={() => updateComplaintStatus(complaint.id, 'Estimate Shared')}>
                        <Send className="mr-2 h-4 w-4" />
                        Share Estimate
                    </Button>
                )}
                {complaint.status === 'Estimate Shared' && (
                    <Button onClick={handleApproveEstimate} variant="outline">
                        <Check className="mr-2 h-4 w-4" />
                        {role === "customer" && "Approve Estimate"}
                        {role === "admin" && "Approve Estimate on Customer Behalf"}
                        {role === "technician" && "Approve Estimate on Customer Behalf"}
                    </Button>
                )}
                {role === "technician" && complaint.status === 'Estimate Approved' && (
                    <Button onClick={() => updateComplaintStatus(complaint.id, 'In Progress')}>
                        <Play className="mr-2 h-4 w-4" />
                        Start Work
                    </Button>
                )}
                {role === "technician" && complaint.status === 'In Progress' && (
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

                <Button onClick={handlePayment}>
                    <Printer className="mr-2 h-4 w-4" />
                    Pay Now
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Save as PDF
                </Button>
            </div>
        </div>
    );
}
