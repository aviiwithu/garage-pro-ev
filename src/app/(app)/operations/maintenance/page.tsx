

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { predictMaintenance } from '@/ai/flows/predictive-maintenance';
import {
  PredictiveMaintenanceInputSchema,
  type PredictiveMaintenanceOutput,
} from '@/ai/schemas';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = PredictiveMaintenanceInputSchema;
const LOCAL_STORAGE_KEY = 'maintenanceForm';

export default function MaintenancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictiveMaintenanceOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: '',
      mileage: 0,
      lastServiceDate: '',
      sensorReadings: '',
      serviceHistory: '',
      driverBehaviorSummary: '',
    },
  });

  useEffect(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Ensure mileage is a number
            if(parsedData.mileage) parsedData.mileage = Number(parsedData.mileage || 0);
            form.reset(parsedData);
        }
    } catch (e) {
        console.error("Failed to parse maintenance form data from localStorage", e);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
      } catch(e) {
        console.error("Failed to save maintenance form data to localStorage", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictMaintenance(values);
      setResult(res);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      setError('An error occurred while analyzing the data. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore > 75) return 'border-red-500 bg-red-50';
    if (riskScore > 50) return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-200';
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <PageHeader
        title="Predictive Maintenance"
        description="Use AI to predict maintenance needs for your vehicles."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Data</CardTitle>
            <CardDescription>
              Enter the details for the vehicle you want to analyze.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle ID / VIN</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ABC-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Mileage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 50000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastServiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Service Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sensorReadings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sensor Readings Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Tire pressure OK, battery temp normal, brake fluid level at 80%"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service History (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Replaced brake pads at 45000 miles. Tire rotation at 48000 miles."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="driverBehaviorSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Behavior Summary (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Frequent hard braking, high average speed."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Data
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Results</CardTitle>
            <CardDescription>
              Predictions and recommendations will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {error && <p className="text-destructive">{error}</p>}
            {result && (
              <div className="space-y-4">
                {result.predictions.length === 0 && (
                  <p>No specific maintenance issues predicted at this time.</p>
                )}
                {result.predictions.map((pred, index) => (
                  <Card
                    key={index}
                    className={`p-4 space-y-3 ${getRiskColor(pred.riskScore)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{pred.potentialIssue}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pred.recommendedAction}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        Risk: {pred.riskScore}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="rounded-lg bg-green-100 p-2">
                           <p className="font-medium text-green-800">Preventative Cost</p>
                           <p className="text-lg font-bold text-green-900">
                               <span className="font-code">INR </span>
                               <span className="font-code">₹</span><span className="font-code">{pred.preventativeCost.toLocaleString()}</span>
                           </p>
                       </div>
                        <div className="rounded-lg bg-red-100 p-2">
                           <p className="font-medium text-red-800">Potential Failure Cost</p>
                           <p className="text-lg font-bold text-red-900">
                               <span className="font-code">INR </span>
                               <span className="font-code">₹</span><span className="font-code">{pred.potentialFailureCost.toLocaleString()}</span>
                           </p>
                       </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
