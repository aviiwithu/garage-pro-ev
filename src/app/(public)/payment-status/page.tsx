
'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentStatusContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const reason = "card invalid"
    const transactionId = searchParams.get('transactionId');

    const isSuccess = false;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-secondary/50 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className={`mx-auto rounded-full p-3 w-fit ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isSuccess ? (
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        ) : (
                            <XCircle className="h-12 w-12 text-red-600" />
                        )}
                    </div>
                    <CardTitle className={`mt-4 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                        {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
                    </CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? 'Thank you! Your payment has been processed successfully.'
                            : 'Unfortunately, we were unable to process your payment.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isSuccess && transactionId && (
                        <p className="text-sm font-semibold">
                            Transaction ID: <span className="font-mono text-muted-foreground">{transactionId}</span>
                        </p>
                    )}
                    {!isSuccess && reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm font-semibold text-red-800">Reason: <span className="font-normal">{decodeURIComponent(reason)}</span></p>
                        </div>
                    )}
                    <Button asChild>
                        <Link href="/dashboard">
                            Return to Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function PaymentStatusPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentStatusContent />
        </Suspense>
    );
}

