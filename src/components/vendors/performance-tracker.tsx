
'use client';

import { Vendor, VendorPerformance } from '@/lib/vendor-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

interface PerformanceTrackerProps {
    performanceRecords: VendorPerformance[];
    vendors: Vendor[];
}

const ScoreCard = ({ title, score }: { title: string, score: number }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm font-semibold">{score}/100</p>
        </div>
        <Progress value={score} />
    </div>
);


export function PerformanceTracker({ performanceRecords, vendors }: PerformanceTrackerProps) {
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');

    const selectedVendorRecords = useMemo(() => {
        if (!selectedVendorId) return [];
        return performanceRecords.filter(p => p.vendorId === selectedVendorId);
    }, [selectedVendorId, performanceRecords]);

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Select Vendor</CardTitle>
                    <CardDescription>Choose a vendor to view their performance history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                        <SelectTrigger className="w-full md:w-1/3">
                            <SelectValue placeholder="Select a vendor..." />
                        </SelectTrigger>
                        <SelectContent>
                            {vendors.map(vendor => (
                                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedVendorId && (
                selectedVendorRecords.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedVendorRecords.map(record => (
                             <Card key={record.id}>
                                <CardHeader>
                                    <CardTitle>Period: {record.period}</CardTitle>
                                    <CardDescription>Overall Score: <span className="font-bold text-lg">{record.overallScore}</span></CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                   <ScoreCard title="Delivery Reliability" score={record.scores.deliveryReliability} />
                                   <ScoreCard title="Quality Consistency" score={record.scores.qualityConsistency} />
                                   <ScoreCard title="Price Competitiveness" score={record.scores.priceCompetitiveness} />
                                   <ScoreCard title="Responsiveness" score={record.scores.responsiveness} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No performance records found for this vendor.</p>
                    </div>
                )
            )}
        </div>
    )
}
