
'use server';
/**
 * @fileOverview An AI agent for analyzing driver behavior.
 *
 * - analyzeDriverBehavior - A function that handles the driver behavior analysis.
 */

import { ai } from '@/ai/genkit';
import { 
    DriverBehaviorInputSchema,
    DriverBehaviorOutputSchema,
    type DriverBehaviorInput,
    type DriverBehaviorOutput
} from '@/ai/schemas';

const prompt = ai.definePrompt({
  name: 'driverBehaviorInsightsPrompt',
  input: { schema: DriverBehaviorInputSchema },
  output: { schema: DriverBehaviorOutputSchema },
  prompt: `You are an AI expert in fleet management and driver safety.
  
  Analyze the following driver metrics to calculate a Safety Score and a Fuel Efficiency Score. 
  Also, generate a list of actionable insights to help the driver improve.

  Driver ID: {{{driverId}}}
  Speeding Incidents: {{{speedingIncidents}}}
  Harsh Braking Events: {{{harshBrakingEvents}}}
  Idling Time (minutes): {{{idlingTimeMinutes}}}
  Fuel Consumption (liters): {{{fuelConsumptionLiters}}}

  - The Safety Score should primarily be based on speeding and harsh braking. More incidents mean a lower score.
  - The Fuel Efficiency Score should be based on idling time and fuel consumption relative to typical usage. More idling and consumption mean a lower score.
  - The insights should be specific, a list of actionable insights for the driver to improve. For example, "Try to reduce idling time to save fuel."
  `,
});


const driverBehaviorInsightsFlow = ai.defineFlow(
  {
    name: 'driverBehaviorInsightsFlow',
    inputSchema: DriverBehaviorInputSchema,
    outputSchema: DriverBehaviorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function analyzeDriverBehavior(input: DriverBehaviorInput): Promise<DriverBehaviorOutput> {
  return driverBehaviorInsightsFlow(input);
}
