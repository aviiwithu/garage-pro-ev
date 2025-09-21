

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComplaintForm } from '@/components/service-tickets/complaint-form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { Complaint, ComplaintStatus } from '@/lib/complaint-data';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CreateTicketPublicPage() {
    const { toast } = useToast();
    const [submitted, setSubmitted] = useState(false);
    const [submittedTicket, setSubmittedTicket] = useState({ vehicleNumber: '', issue: '' });

    // Standalone function to add a complaint directly to Firestore,
    // as this public page does not have access to the ComplaintContext.
    async function addComplaintPublic(complaintData: any, attachments: FileList | null) {
        const { detailedIssue, ...restOfData } = complaintData;

        const newComplaintData: any = {
            ...restOfData,
            issue: complaintData.issue, // The main title
            detailedIssue: detailedIssue, // The longer description
            vehicleNumber: restOfData.registrationNumber,
            status: 'Open' as ComplaintStatus,
            createdAt: new Date().toISOString(),
            assignedTo: 'Unassigned',
            statusHistory: [{ status: 'Open' as ComplaintStatus, timestamp: new Date().toISOString() }],
            estimatedItems: { parts: [], services: [] },
            actualItems: { parts: [], services: [] },
            attachmentUrls: [],
        };
        const docRef = await addDoc(collection(db, 'complaints'), newComplaintData);

        if (attachments && attachments.length > 0) {
            const urls = await Promise.all(
                Array.from(attachments).map(async (file) => {
                    const storageRef = ref(storage, `complaints/${docRef.id}/${file.name}`);
                    await uploadBytes(storageRef, file);
                    return await getDownloadURL(storageRef);
                })
            );
            // Correctly update the document instead of creating a new one
            await updateDoc(docRef, { attachmentUrls: urls });
        }
    }

    const handleFormSubmit = async (data: any, attachments: FileList | null) => {
        try {
            await addComplaintPublic(data, attachments);
            setSubmittedTicket({ vehicleNumber: data.registrationNumber, issue: data.issue });
            setSubmitted(true);
             toast({
                title: "Ticket Submitted Successfully",
                description: "Our team will review your request shortly.",
            });
        } catch (error) {
             toast({
                title: "Submission Failed",
                description: "There was an error submitting your ticket. Please try again.",
                variant: 'destructive'
            });
        }
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <CardTitle className="mt-4">Submission Successful!</CardTitle>
                        <CardDescription>
                            Your service ticket has been received. Our team will get in touch with you shortly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <p className="text-sm font-semibold">Vehicle Number: <span className="font-normal">{submittedTicket.vehicleNumber}</span></p>
                       <p className="text-sm font-semibold">Issue: <span className="font-normal">{submittedTicket.issue}</span></p>
                       <p className="text-xs text-muted-foreground pt-4">You can now close this window.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>Submit a Service Ticket</CardTitle>
                    <CardDescription>
                        Please fill out the form below to report an issue or request service.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ComplaintForm onSubmit={handleFormSubmit} />
                </CardContent>
            </Card>
        </div>
    );
}
