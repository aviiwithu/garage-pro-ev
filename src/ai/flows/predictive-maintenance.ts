
'use server';
/**
 * @fileOverview A predictive maintenance AI agent for vehicles.
 *
 * - predictMaintenance - A function that handles the predictive maintenance process.
 */

import { ai } from '@/ai/genkit';
import { 
    PredictiveMaintenanceInputSchema,
    PredictiveMaintenanceOutputSchema,
    type PredictiveMaintenanceInput,
    type PredictiveMaintenanceOutput
} from '@/ai/schemas';

const prompt = ai.definePrompt({
  name: 'predictiveMaintenancePrompt',
  input: { schema: PredictiveMaintenanceInputSchema },
  output: { schema: PredictiveMaintenanceOutputSchema },
  prompt: `You are an AI expert in predictive maintenance for electric vehicles. 
  
  Analyze the following vehicle data to predict potential maintenance issues. Provide a list of recommendations.

  Vehicle ID: {{{vehicleId}}}
  Mileage: {{{mileage}}}
  Last Service Date: {{{lastServiceDate}}}
  Sensor Readings: {{{sensorReadings}}}
  Service History: {{{serviceHistory}}}
  Driver Behavior Summary: {{{driverBehaviorSummary}}}

  Based on this data, identify potential issues, recommend specific actions, and provide a risk score (0-100), a preventative cost, and a potential failure cost for each prediction.
  Focus on common EV components like battery, brakes, tires, and motor.
  `,
});


const predictiveMaintenanceFlow = ai.defineFlow(
  {
    name: 'predictiveMaintenanceFlow',
    inputSchema: PredictiveMaintenanceInputSchema,
    outputSchema: PredictiveMaintenanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function predictMaintenance(input: PredictiveMaintenanceInput): Promise<PredictiveMaintenanceOutput> {
  return predictiveMaintenanceFlow(input);
}
