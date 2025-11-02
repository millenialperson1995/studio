'use server';
/**
 * @fileOverview Fluxo de IA para transcrever áudio em texto.
 *
 * - transcreverAudio: Função que dispara o fluxo de transcrição.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

// O input agora espera apenas os dados base64, sem o prefixo do data URI.
const TranscricaoInputSchema = z.object({
  audioBase64: z.string().describe("Os dados de áudio a serem transcritos, como uma string base64."),
  mimeType: z.string().describe("O MIME type do áudio, ex: 'audio/webm'"),
});

const TranscricaoOutputSchema = z.object({
  texto: z.string().describe('O texto transcrito do áudio.'),
});

export async function transcreverAudio(input: z.infer<typeof TranscricaoInputSchema>): Promise<z.infer<typeof TranscricaoOutputSchema>> {
  return await transcricaoFlow(input);
}


const transcricaoFlow = ai.defineFlow(
  {
    name: 'transcricaoFlow',
    inputSchema: TranscricaoInputSchema,
    outputSchema: TranscricaoOutputSchema,
  },
  async (input) => {
    // Converte a string base64 para um buffer
    const audioBuffer = Buffer.from(input.audioBase64, 'base64');
    
    // O modelo de transcrição funciona melhor com formatos como WAV.
    // O áudio do navegador geralmente vem como webm, então convertemos.
    // Embora a conversão para WAV não seja estritamente sempre necessária, 
    // ela aumenta a compatibilidade e a confiabilidade.
    // Neste caso, vamos passar o áudio diretamente, pois os modelos mais recentes
    // têm boa compatibilidade com webm/opus. Se houver problemas, a conversão para WAV
    // seria o próximo passo.

    const { output } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash'), // Modelo capaz de processar áudio
        prompt: `Você é um especialista em mecânica. Transcreva o áudio a seguir, que contém uma descrição de sintomas de um motor, para texto em português do Brasil. Seja o mais fiel possível ao que foi dito.`,
        history: [
            {
                role: 'user',
                content: [
                    { media: { url: `data:${input.mimeType};base64,${input.audioBase64}` } }
                ]
            }
        ],
        output: {
            schema: TranscricaoOutputSchema,
        }
    });

    if (!output || !output.texto) {
      throw new Error('A IA não conseguiu gerar uma transcrição válida.');
    }
    
    return { texto: output.texto };
  }
);