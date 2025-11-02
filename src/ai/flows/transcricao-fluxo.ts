'use server';
/**
 * @fileOverview Fluxo de IA para transcrever áudio em texto.
 *
 * - transcreverAudio: Função que dispara o fluxo de transcrição.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranscricaoInputSchema = z.object({
  audioDataUri: z.string().describe(
    "O áudio a ser transcrito, como um data URI que deve incluir um MIME type. Ex: 'data:audio/webm;base64,...'"
  ),
});

const TranscricaoOutputSchema = z.object({
  texto: z.string().describe('O texto transcrito do áudio.'),
});

export async function transcreverAudio(input: z.infer<typeof TranscricaoInputSchema>): Promise<z.infer<typeof TranscricaoOutputSchema>> {
  return await transcricaoFlow(input);
}

const transcricaoPrompt = ai.definePrompt({
  name: 'transcricaoAudioPrompt',
  input: { schema: TranscricaoInputSchema },
  output: { schema: TranscricaoOutputSchema },
  prompt: 'Transcreva o seguinte áudio para texto em português do Brasil: {{media url=audioDataUri}}',
});

const transcricaoFlow = ai.defineFlow(
  {
    name: 'transcricaoFlow',
    inputSchema: TranscricaoInputSchema,
    outputSchema: TranscricaoOutputSchema,
  },
  async (input) => {
    const { output } = await transcricaoPrompt(input);
    if (!output) {
      throw new Error('A IA não conseguiu gerar uma transcrição válida.');
    }
    return { texto: output.texto };
  }
);
