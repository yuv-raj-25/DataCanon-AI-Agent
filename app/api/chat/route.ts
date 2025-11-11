import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages , tool} from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function GET() {
  return new Response('Chat endpoint is live ✅', { status: 200 });
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    //   console.log('✅ Received messages:', JSON.stringify(messages, null, 2))

    const SYSTEM_PROMPT = `You are an SQL assistant that helps user to query their database using natural language.
    You have access to following tools:
    1. db tool - call this tool to query the database.

    Rules:
    - Generate ONLY SELECT queries (no INSERT , UPDATE , DELETE, DROP).
    - Return valid SQLite syntax

    Always respond in a helpfull, conversational tone while being technically accurate. 

    `;
//    1. Schema tool - call this tool to get the database schema which will help you to write accurate SQL queries.
//  - Always use the schema provided by the schema tool 

    const result = streamText({
      model: openai('gpt-4o'),
      messages: convertToModelMessages(messages),
      system: SYSTEM_PROMPT,
      tools: {
      db: tool({
        description: 'call this tool to query a database',
        inputSchema: z.object({
          query: z.string().describe('the SQL query '),
        }),
        execute: async ({ query }) => {
            console.log("Query", query);
            return '';
        },
      }),
      convertFahrenheitToCelsius: tool({
        description: 'Convert a temperature in fahrenheit to celsius',
        inputSchema: z.object({
          temperature: z
            .number()
            .describe('The temperature in fahrenheit to convert'),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return {
            celsius,
          };
        },
      }),
    },
    });


    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('❌ Chat route error:', err);
    return new Response(JSON.stringify({ error: 'AI call failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
    
  }
}