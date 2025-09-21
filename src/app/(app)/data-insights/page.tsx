
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { analyzeData, DataAnalysisOutput } from '@/ai/flows/data-analysis-flow';
import { Complaint } from '@/lib/complaint-data';
import { InventoryPart } from '@/lib/inventory-data';
import { Technician } from '@/lib/technician-data';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useComplaint } from '@/context/ComplaintContext';
import { useInventory } from '@/context/InventoryContext';
import { useEmployee } from '@/context/EmployeeContext';
import { db } from '@/lib/firebase';

type DatasetValue = 'complaints' | 'inventory' | 'technicians';

export default function DataInsightsPage() {
    const [selectedDataset, setSelectedDataset] = useState<DatasetValue | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DataAnalysisOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { complaints, loading: complaintsLoading } = useComplaint();
    const { parts, loading: inventoryLoading } = useInventory();
    const { technicians, loading: techniciansLoading } = useEmployee();
    
    const dataLoading = complaintsLoading || inventoryLoading || techniciansLoading;

    const datasets = {
        complaints: { name: 'Service Tickets', data: complaints },
        inventory: { name: 'Inventory Parts', data: parts },
        technicians: { name: 'Technicians', data: technicians },
    };

    const handleAnalyze = async () => {
        if (!selectedDataset) {
            setError('Please select a dataset to analyze.');
            return;
        }

        setIsLoading(true);
        setResult(null);
        setError(null);
        
        try {
            const datasetInfo = datasets[selectedDataset];
            const response = await analyzeData({
                datasetName: datasetInfo.name,
                dataJson: JSON.stringify(datasetInfo.data, null, 2),
            });
            setResult(response);
        } catch (e) {
            console.error('Error analyzing data:', e);
            setError('An error occurred during analysis. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <PageHeader
                title="AI-Powered Data Insights"
                description="Analyze your operational data to uncover trends and anomalies."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Select Data for Analysis</CardTitle>
                    <CardDescription>Choose a dataset and let the AI generate a report.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Select value={selectedDataset} onValueChange={(value) => setSelectedDataset(value as DatasetValue)}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select a dataset..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="complaints">Service Tickets</SelectItem>
                            <SelectItem value="inventory">Inventory Parts</SelectItem>
                            <SelectItem value="technicians">Technicians</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAnalyze} disabled={!selectedDataset || isLoading || dataLoading}>
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                        ) : (
                            <><Sparkles className="mr-2 h-4 w-4" />Analyze Data</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            )}

            {error && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle /> Analysis Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Analysis Report for {datasets[selectedDataset as DatasetValue].name}</CardTitle>
                        <CardDescription>{result.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><TrendingUp /> Key Trends</h3>
                            <ul className="list-disc list-inside space-y-1 bg-secondary p-4 rounded-md">
                                {result.keyTrends.map((trend, index) => <li key={index}>{trend}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><AlertTriangle /> Anomalies & Outliers</h3>
                             <ul className="list-disc list-inside space-y-1 bg-secondary p-4 rounded-md">
                                {result.anomalies.map((anomaly, index) => <li key={index}>{anomaly}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Lightbulb /> Actionable Insights</h3>
                             <ul className="list-disc list-inside space-y-1 bg-secondary p-4 rounded-md">
                                {result.actionableInsights.map((insight, index) => <li key={index}>{insight}</li>)}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
