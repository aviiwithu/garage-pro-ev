
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComplaintForm } from '@/components/service-tickets/complaint-form';
import { useComplaint } from '@/context/ComplaintContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ServiceTicketsPage() {
    const { addComplaint } = useComplaint();
    const { toast } = useToast();
    const router = useRouter();
    const LOCAL_STORAGE_KEY = 'complaintForm';

    const handleFormSubmit = async (data: any, attachments: FileList | null) => {
        try {
            await addComplaint(data, attachments);
            toast({
                title: "Ticket Submitted",
                description: `A new service ticket for ${data.registrationNumber} has been created.`,
                variant: "default"
            });
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            router.push('/operations/complaint-dashboard');
        } catch (error) {
             toast({
                title: "Submission Failed",
                description: "There was an error submitting your ticket. Please try again.",
                variant: 'destructive'
            });
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="Submit a Service Ticket"
                description="Please provide detailed information about the issue."
            />
            <Card>
                <CardHeader>
                    <CardTitle>New Service Ticket</CardTitle>
                    <CardDescription>
                        Fill out the form below to report an issue or request service.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ComplaintForm onSubmit={handleFormSubmit} />
                </CardContent>
            </Card>
        </div>
    );
}
