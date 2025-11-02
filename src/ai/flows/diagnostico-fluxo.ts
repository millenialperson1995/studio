'use server';
/**
 * @fileOverview Fluxo de IA para diagnóstico de problemas em motores de retífica.
 *
 * - diagnosticarMotor: Função que dispara o fluxo de diagnóstico.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { DiagnosticoMotorInput, DiagnosticoMotorOutput } from '@/lib/types';
import { googleAI } from '@genkit-ai/google-genai';

// Zod Schemas must be defined in the same file as the "use server" flow.
const ItemSchema = z.object({
  codigo: z.string(),
  descricao: z.string(),
});

const DiagnosticoMotorInputSchema = z.object({
  sintomas: z.string().describe('Os sintomas observados no motor, descritos pelo mecânico ou cliente.'),
  motorInfo: z.string().describe('Informações sobre o motor (ex: VW AP 1.8, Fiat Fire 1.0).'),
  servicosDisponiveis: z.array(ItemSchema).describe('A lista de todos os serviços que a retífica oferece.'),
  pecasDisponiveis: z.array(ItemSchema).describe('A lista de todas as peças disponíveis no catálogo.'),
});

const DiagnosticoMotorOutputSchema = z.object({
  diagnosticoProvavel: z.string().describe('Um resumo técnico das causas mais prováveis para os sintomas, em uma ou duas frases.'),
  planoDeAcao: z.array(z.object({
      passo: z.string().describe('Ação de verificação ou diagnóstico a ser tomada.'),
      isCritico: z.boolean().describe('Indica se o passo é crítico para o diagnóstico.'),
  })).describe('Uma lista de passos investigativos para confirmar o diagnóstico.'),
  servicosSugeridos: z.array(ItemSchema).describe('Uma lista de serviços da retífica sugeridos para corrigir o problema. Deve usar APENAS itens da lista de `servicosDisponiveis`.'),
  pecasSugeridas: z_array(ItemSchema).describe('Uma lista de peças que provavelmente serão necessárias. Deve usar APENAS itens da lista de `pecasDisponiveis`.'),
});


// Função pública que o frontend vai chamar
export async function diagnosticarMotor(input: DiagnosticoMotorInput): Promise<DiagnosticoMotorOutput> {
  const flowResponse = await diagnosticoMotorFlow(input);
  return flowResponse;
}

// Definição do Prompt para a IA
const diagnosticoPrompt = ai.definePrompt({
  name: 'diagnosticoMotorPrompt',
  input: { schema: DiagnosticoMotorInputSchema },
  output: { schema: DiagnosticoMotorOutputSchema },
  prompt: `
    Você é um engenheiro mecânico sênior, especialista em retífica de motores com 30 anos de experiência. Sua tarefa é analisar os sintomas de um motor e, com base no catálogo de serviços e peças de uma retífica específica, criar um plano de diagnóstico e ação.

    **Contexto do Motor:**
    - Motor: {{{motorInfo}}}
    - Sintomas observados: {{{sintomas}}}

    **Catálogo da Retífica (Use APENAS estes itens):**
    - Serviços Disponíveis:
    {{#each servicosDisponiveis}}
      - {{this.descricao}} (Código: {{this.codigo}})
    {{/each}}
    - Peças Disponíveis:
    {{#each pecasDisponiveis}}
      - {{this.descricao}} (Código: {{this.codigo}})
    {{/each}}

    **Sua Tarefa:**
    1.  **Diagnóstico Provável:** Com base nos sintomas e no tipo de motor, descreva a causa raiz mais provável do problema de forma técnica e concisa.
    2.  **Plano de Ação:** Crie uma lista de no máximo 3 passos de verificação que o mecânico deve seguir para confirmar o diagnóstico.
    3.  **Serviços Sugeridos:** Baseado no seu diagnóstico, selecione na lista de 'Serviços Disponíveis' os serviços essenciais para a correção. NÃO invente serviços que não estão na lista.
    4.  **Peças Sugeridas:** Liste as peças da 'Peças Disponíveis' que serão provavelmente necessárias. NÃO invente peças que não estão na lista.

    Responda estritamente no formato JSON solicitado.
  `,
});

// Definição do Fluxo (Flow)
const diagnosticoMotorFlow = ai.defineFlow(
  {
    name: 'diagnosticoMotorFlow',
    inputSchema: DiagnosticoMotorInputSchema,
    outputSchema: DiagnosticoMotorOutputSchema,
  },
  async (input) => {
    const { output } = await diagnosticoPrompt(input);
    
    if (!output) {
      throw new Error("A IA não conseguiu gerar um diagnóstico válido.");
    }
    
    return output;
  }
);
