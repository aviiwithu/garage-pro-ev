
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const SettingRow = ({ id, label, description, checked, onCheckedChange }: { id: string, label: string, description: string, checked?: boolean, onCheckedChange?: (checked: boolean) => void }) => (
  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-base">{label}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default function CustomerPortalPage() {
  const [isCustomTabOpen, setIsCustomTabOpen] = useState(false);
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Customer Portal"
        description="Configure your customer portal settings and preferences."
      />
      
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Portal Settings</CardTitle>
                <CardDescription>
                    Manage your portal URL and welcome message.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="portal-url">Portal URL</Label>
                    <Input id="portal-url" readOnly value="/login" />
                </div>
                 <div>
                    <Label htmlFor="banner-message">Banner Message</Label>
                    <Textarea id="banner-message" placeholder="This message will be displayed on top of the portal's Home page." defaultValue="Welcome, We are happy to serve you at Battwheels" />
                </div>
            </CardContent>
        </Card>
        
        <Dialog open={isCustomTabOpen} onOpenChange={setIsCustomTabOpen}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Custom Tabs</CardTitle>
                    <CardDescription>
                        Display additional information like announcements or reports in the portal.
                    </CardDescription>
                  </div>
                  <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Custom Tab
                      </Button>
                  </DialogTrigger>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
                        <p>You haven't created any custom tabs yet.</p>
                        <p className="text-xs">Click '+ New Custom Tab' to add modules or reports for your customers.</p>
                    </div>
                </CardContent>
            </Card>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Custom Tab</DialogTitle>
                    <DialogDescription>
                        Add a new module or report to the customer portal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tab-name" className="text-right">Tab Name</Label>
                        <Input id="tab-name" placeholder="e.g., My Reports" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tab-content" className="text-right">Content</Label>
                        <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a module or report" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="service-history">Service History Report</SelectItem>
                                <SelectItem value="amc-details">AMC Details</SelectItem>
                                <SelectItem value="invoice-summary">Invoice Summary</SelectItem>
                                <SelectItem value="vehicle-list">My Vehicles</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="tab-visible" className="text-right">Visible</Label>
                         <Switch id="tab-visible" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => setIsCustomTabOpen(false)}>Save Tab</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


        <Card>
            <CardHeader>
                <CardTitle>Portal Preferences</CardTitle>
                <CardDescription>
                    Enable or disable features and notifications for your customers.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <SettingRow 
                    id="allow-signup"
                    label="Allow customers to sign up to the Customer Portal"
                    description="Customers can sign up themselves using links on public invoice payment pages."
                    checked
                />
                <SettingRow 
                    id="notify-activity"
                    label="Notify me about Customer Portal activity"
                    description="Get notified about payments, comments, or approvals."
                />
                 <SettingRow 
                    id="notify-customer-comment"
                    label="Send an email notification to customers when I comment on transactions"
                    description="Customers will be emailed when you comment on their transactions in the portal."
                    checked
                />
                 <SettingRow 
                    id="allow-upload-edit"
                    label="Allow customers to upload documents and edit their information"
                    description="Customers can upload documents and edit their basic details like address."
                />
                 <SettingRow 
                    id="allow-forward"
                    label="Allow customers to forward documents from the portal"
                    description="Customers can share invoices with their contacts via email from the portal."
                    checked
                />
                 <SettingRow 
                    id="allow-bulk-payment"
                    label="Enable customers to make bulk payments for invoices"
                    description="Customers can select and pay for multiple invoices at once."
                    checked
                />
                 <SettingRow 
                    id="enable-reviews"
                    label="Enable customer reviews for my service"
                    description="Customers can rate your service and provide feedback (reviews are private)."
                />
                 <SettingRow 
                    id="view-sales-orders"
                    label="Allow customers to view Sales Orders"
                    description="This option allows your customers to view Sales Orders in the portal."
                />
                 <SettingRow 
                    id="view-credit-notes"
                    label="Display credit notes in the portal"
                    description="Customers can view their credit notes, applied invoices, and refund details."
                    checked
                />
            </CardContent>
             <CardFooter className="flex justify-end">
                <Button>Save Preferences</Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
