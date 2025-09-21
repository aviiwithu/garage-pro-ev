'use server';
/**
 * @fileOverview An AI agent for analyzing business data and identifying trends.
 *
 * - analyzeData - A function that takes a dataset and returns insights.
 */

import { ai } from '@/ai/genkit';
import {
  DataAnalysisInputSchema,
  DataAnalysisOutputSchema,
  type DataAnalysisInput,
  type DataAnalysisOutput,
} from '@/ai/schemas';

const prompt = ai.definePrompt({
  name: 'dataAnalysisPrompt',
  input: { schema: DataAnalysisInputSchema },
  output: { schema: DataAnalysisOutputSchema },
  prompt: `You are an expert business analyst for an EV garage named GaragePRO. Your task is to analyze a given dataset and provide a report on key trends, anomalies, and actionable insights.

  You are analyzing the "{{datasetName}}" dataset. Here is the data:
  {{{dataJson}}}

  Instructions:
  1.  **Identify Key Trends**: Look for patterns over time, common occurrences, or relationships between different data points. For example, are certain types of repairs more common in specific months? Are parts from a particular supplier running out of stock frequently?
  2.  **Detect Anomalies**: Find any data points that are unusual or deviate from the norm. For instance, a sudden spike in "Critical" priority tickets or an unusually long resolution time for a specific technician.
  3.  **Generate Actionable Insights**: Based on the trends and anomalies, provide specific, practical recommendations for the business. For example, "Consider stocking more of Part X in Q3 due to recurring demand," or "Technician Y may need additional training on electrical systems, as their resolution times are higher for these issues."
  4.  **Summarize Findings**: Write a short, executive-level summary of the most important conclusions from your analysis.
  
  Present your findings clearly and concisely in the requested output format.`,
});

const dataAnalysisFlow = ai.defineFlow(
  {
    name: 'dataAnalysisFlow',
    inputSchema: DataAnalysisInputSchema,
    outputSchema: DataAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function analyzeData(
  input: DataAnalysisInput
): Promise<DataAnalysisOutput> {
  return dataAnalysisFlow(input);
}
