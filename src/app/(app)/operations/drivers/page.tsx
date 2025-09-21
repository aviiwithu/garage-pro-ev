

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
import { analyzeDriverBehavior } from '@/ai/flows/driver-behavior-insights';
import {
  DriverBehaviorInputSchema,
  type DriverBehaviorOutput,
} from '@/ai/schemas';
import { Loader2, Sparkles, Trophy, Fuel, Lightbulb } from 'lucide-react';

const formSchema = DriverBehaviorInputSchema;
const LOCAL_STORAGE_KEY = 'driverBehaviorForm';


export default function DriverBehaviorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DriverBehaviorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverId: '',
      speedingIncidents: 0,
      harshBrakingEvents: 0,
      idlingTimeMinutes: 0,
      fuelConsumptionLiters: 0,
    },
  });

  useEffect(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Ensure numeric fields are numbers
            if(parsedData.speedingIncidents) parsedData.speedingIncidents = Number(parsedData.speedingIncidents || 0);
            if(parsedData.harshBrakingEvents) parsedData.harshBrakingEvents = Number(parsedData.harshBrakingEvents || 0);
            if(parsedData.idlingTimeMinutes) parsedData.idlingTimeMinutes = Number(parsedData.idlingTimeMinutes || 0);
            if(parsedData.fuelConsumptionLiters) parsedData.fuelConsumptionLiters = Number(parsedData.fuelConsumptionLiters || 0);
            form.reset(parsedData);
        }
    } catch (e) {
        console.error("Failed to parse driver behavior form data from localStorage", e);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
      } catch(e) {
        console.error("Failed to save driver behavior form data to localStorage", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeDriverBehavior(values);
      setResult(res);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      setError(
        'An error occurred while analyzing driver data. Please try again.'
      );
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <PageHeader
        title="Driver Behavior Analysis"
        description="Use AI to analyze driver metrics and get safety insights."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Driver Metrics</CardTitle>
            <CardDescription>
              Enter the monthly metrics for the driver.
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
                  name="driverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., DRV-007" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="speedingIncidents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speeding Incidents</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                  name="harshBrakingEvents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harsh Braking Events</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                  name="idlingTimeMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idling Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                  name="fuelConsumptionLiters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Consumption (Liters)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Insights
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Report</CardTitle>
            <CardDescription>
              Scores and insights will appear here.
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
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <Card>
                    <CardHeader className="pb-2">
                      <Trophy className="mx-auto h-8 w-8 text-primary" />
                      <CardTitle className="text-lg">Safety Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{result.safetyScore}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <Fuel className="mx-auto h-8 w-8 text-primary" />
                      <CardTitle className="text-lg">
                        Fuel Efficiency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">
                        {result.fuelEfficiencyScore}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h4 className="mb-2 flex items-center text-lg font-semibold">
                    <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
                    Actionable Insights
                  </h4>
                  <ul className="list-inside list-disc space-y-2 rounded-lg bg-secondary p-4">
                    {result.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    