'use server';
/**
 * @fileOverview Fluxo de IA para diagnóstico de problemas em motores de retífica.
 *
 * - diagnosticarMotor: Função que dispara o fluxo de diagnóstico.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { DiagnosticoMotorInputSchema, DiagnosticoMotorOutputSchema, type DiagnosticoMotorInput, type DiagnosticoMotorOutput } from '@/lib/types';


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
