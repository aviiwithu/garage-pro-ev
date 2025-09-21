import { z } from 'zod';

// Schema for Predictive Maintenance
export const PredictiveMaintenanceInputSchema = z.object({
  vehicleId: z.string().describe('The unique identifier for the vehicle.'),
  mileage: z.number().describe('The current mileage of the vehicle.'),
  lastServiceDate: z
    .string()
    .describe('The date of the last service (YYYY-MM-DD).'),
  sensorReadings: z
    .string()
    .describe('A summary of sensor readings (e.g., tire pressure, engine temp).'),
  serviceHistory: z.string().describe('A summary of past service records.').optional(),
  driverBehaviorSummary: z
    .string()
    .describe("A summary of the driver's habits (e.g., frequent hard braking).")
    .optional(),
});
export type PredictiveMaintenanceInput = z.infer<
  typeof PredictiveMaintenanceInputSchema
>;

export const PredictiveMaintenanceOutputSchema = z.object({
  predictions: z.array(
    z.object({
      potentialIssue: z
        .string()
        .describe('The potential issue that might occur (e.g., Brake Pad Wear).'),
      recommendedAction: z
        .string()
        .describe('The recommended maintenance action to perform.'),
      riskScore: z
        .number()
        .min(0)
        .max(100)
        .describe(
          'A risk score from 0-100 indicating the likelihood and severity.'
        ),
      preventativeCost: z
        .number()
        .describe('The estimated cost to perform the maintenance preventatively.'),
      potentialFailureCost: z
        .number()
        .describe('The estimated cost if the component fails.'),
    })
  ),
});
export type PredictiveMaintenanceOutput = z.infer<
  typeof PredictiveMaintenanceOutputSchema
>;

// Schema for Driver Behavior Analysis
export const DriverBehaviorInputSchema = z.object({
  driverId: z.string().describe('The unique identifier for the driver.'),
  speedingIncidents: z
    .number()
    .describe('The number of speeding incidents this month.'),
  harshBrakingEvents: z
    .number()
    .describe('The number of harsh braking events this month.'),
  idlingTimeMinutes: z
    .number()
    .describe('Total idling time in minutes this month.'),
  fuelConsumptionLiters: z
    .number()
    .describe('Total fuel consumption in liters this month.'),
});
export type DriverBehaviorInput = z.infer<typeof DriverBehaviorInputSchema>;

export const DriverBehaviorOutputSchema = z.object({
  safetyScore: z.number().min(0).max(100).describe('A safety score from 0 to 100.'),
  fuelEfficiencyScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A fuel efficiency score from 0 to 100.'),
  insights: z
    .array(z.string())
    .describe('A list of actionable insights for the driver to improve.'),
});
export type DriverBehaviorOutput = z.infer<typeof DriverBehaviorOutputSchema>;

// Schema for Customer Support Chatbot
export const CustomerSupportInputSchema = z.object({
  customerId: z.string().describe('The unique identifier for the customer.'),
  customerName: z.string().describe("The customer's name."),
  message: z.string().describe("The customer's message or query."),
  complaints: z
    .string()
    .describe("A JSON string of the customer's recent service tickets."),
  invoices: z
    .string()
    .describe("A JSON string of the customer's recent invoices."),
  amc: z
    .string()
    .describe(
      "A JSON string of the customer's Annual Maintenance Contract details. Can be null."
    ),
});
export type CustomerSupportInput = z.infer<typeof CustomerSupportInputSchema>;

export const CustomerSupportOutputSchema = z.object({
  response: z.string().describe("The chatbot's response to the customer."),
});
export type CustomerSupportOutput = z.infer<typeof CustomerSupportOutputSchema>;

// Schema for Data Analysis
export const DataAnalysisInputSchema = z.object({
  datasetName: z
    .string()
    .describe(
      'The name of the dataset being analyzed (e.g., "Service Tickets", "Inventory Parts").'
    ),
  dataJson: z.string().describe('The dataset to analyze, provided as a JSON string.'),
});
export type DataAnalysisInput = z.infer<typeof DataAnalysisInputSchema>;

export const DataAnalysisOutputSchema = z.object({
  keyTrends: z
    .array(z.string())
    .describe('A list of the most significant trends or patterns discovered in the data.'),
  anomalies: z
    .array(z.string())
    .describe('A list of any notable anomalies, outliers, or unexpected findings in the data.'),
  actionableInsights: z
    .array(z.string())
    .describe('A list of actionable business insights or recommendations based on the analysis.'),
  summary: z.string().describe('A brief, high-level summary of the findings.'),
});
export type DataAnalysisOutput = z.infer<typeof DataAnalysisOutputSchema>;
