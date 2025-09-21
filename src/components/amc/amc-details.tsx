
'use client';

import { AMC, amcPackages } from '@/lib/amc-data';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';

interface AmcDetailsProps {
    amc: AMC;
}

export function AmcDetails({ amc }: AmcDetailsProps) {
    const planDetails = amcPackages.find(p => p.name === amc.planName);

    const getStatusClass = (status: AMC['status']) => {
        switch (status) {
            case 'Active': return 'text-green-600';
            case 'Expired': return 'text-gray-500';
            case 'Cancelled': return 'text-red-600';
            default: return '';
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-semibold">{amc.customerName}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">Vehicle Number</p>
                    <p className="font-semibold">{amc.vehicleNumber}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-semibold">{format(new Date(amc.startDate), 'PPP')}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-semibold">{format(new Date(amc.endDate), 'PPP')}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className={`font-bold ${getStatusClass(amc.status)}`}>{amc.status}</p>
                </div>
            </div>

            <Separator />

            {planDetails && (
                <div>
                    <h4 className="text-lg font-semibold mb-2">{planDetails.name} Plan</h4>
                    <p className="text-muted-foreground mb-4">{planDetails.description}</p>
                    
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
                        {planDetails.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-primary" />
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>

                     <div className="text-right mt-4">
                        <p className="text-muted-foreground">Plan Price</p>
                        <p className="text-2xl font-bold">
                            <span className="font-sans">INR </span>
                            <span className="font-sans">₹</span><span className="font-code">{planDetails.price.toLocaleString()}</span>
                        </p>
                    </div>

                </div>
            )}
            
        </div>
    )
}
