
'use server';
/**
 * @fileOverview A customer support AI agent.
 *
 * - answerCustomerQuery - A function that handles the customer's query.
 */

import { ai } from '@/ai/genkit';
import { 
    CustomerSupportInputSchema,
    CustomerSupportOutputSchema,
    type CustomerSupportInput,
    type CustomerSupportOutput
} from '@/ai/schemas';

const prompt = ai.definePrompt({
  name: 'customerSupportPrompt',
  input: { schema: CustomerSupportInputSchema },
  output: { schema: CustomerSupportOutputSchema },
  prompt: `You are "ProBot", a friendly and helpful AI assistant for GaragePRO, an electric vehicle service center. 
  
  Your personality is professional, empathetic, and clear. Your goal is to provide accurate and helpful information to customers.

  You are speaking with: {{{customerName}}} (ID: {{{customerId}}}).

  Here is the customer's data. Use it to answer their questions.
  - Service Tickets (Complaints): {{{complaints}}}
  - Invoices: {{{invoices}}}
  - Annual Maintenance Contract (AMC): {{{amc}}}

  Based on this information, provide a helpful response to the customer's message below.

  Customer Message:
  "{{{message}}}"

  Instructions:
  - If you don't have information, say so. Do not make things up.
  - Keep your answers concise and easy to understand.
  - If the query is complex or requires human intervention, advise the customer to contact support directly at support@garagepro.com.
  - Be friendly and use the customer's name.
  `,
});


const customerSupportFlow = ai.defineFlow(
  {
    name: 'customerSupportFlow',
    inputSchema: CustomerSupportInputSchema,
    outputSchema: CustomerSupportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function answerCustomerQuery(input: CustomerSupportInput): Promise<CustomerSupportOutput> {
  return customerSupportFlow(input);
}
