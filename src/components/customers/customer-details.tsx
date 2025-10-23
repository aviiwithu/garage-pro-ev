
'use client';

import { Customer } from '@/lib/customer-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';

interface CustomerDetailsProps {
  customer: Customer;
}

const DetailItem = ({ label, value }: { label: string; value?: string | string[] | null; }) => {
    if (!value && typeof value !== 'string') return null;
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1 mt-1">
                    {value.map(v => <Badge key={v} variant="secondary">{v}</Badge>)}
                </div>
            ) : (
                <p className="font-semibold">{value}</p>
            )}
        </div>
    );
};


export function CustomerDetails({ customer }: CustomerDetailsProps) {
    const customerName = customer.type === 'B2B' ? customer.companyName : `${customer.salutation || ''} ${customer.name || ''}`.trim();

    return (
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{customer.displayName}</CardTitle>
                            <CardDescription>
                                {customerName}
                            </CardDescription>
                        </div>
                        <Badge variant="outline">{customer.type}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DetailItem label="Email" value={customer.email} />
                    <DetailItem label="Phone" value={customer.phone} />
                    <DetailItem label="Address" value={customer.address} />
                </CardContent>
            </Card>
            
            <Separator />
            
            <div className="space-y-4">
                <h4 className="font-medium">Registration & Tax Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Vehicle Numbers" value={customer.vehicles} />
                    <DetailItem label="GST Number" value={customer.gstNumber} />
                    <DetailItem label="PAN" value={customer.pan} />
                </div>
            </div>

            <Separator />
            
             <div className="space-y-4">
                <h4 className="font-medium">Other Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Portal Access" value={customer.portalStatus} />
                    <DetailItem label="Additional Contact Persons" value={(customer as any).contactPersons} />
                    <DetailItem label="Internal Remarks" value={customer.remarks} />
                </div>
            </div>
        </div>
    );
}
