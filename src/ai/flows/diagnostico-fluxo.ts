'use server';
/**
 * @fileOverview Fluxo de diagnóstico de motor utilizando IA.
 * 
 * - diagnosticarMotor: Função que recebe os sintomas e retorna um plano de diagnóstico.
 * - DiagnosticoMotorInput: Tipo de entrada para a função.
 * - DiagnosticoMotorOutput: Tipo de saída da função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { DiagnosticoMotorInput, DiagnosticoMotorOutput } from '@/lib/types';
import { googleAI } from '@genkit-ai/google-genai';


const CausaProvavelSchema = z.object({
    causa: z.string().describe('A causa provável do problema.'),
    probabilidade: z.enum(['alta', 'media', 'baixa']).describe('A probabilidade desta ser a causa correta.'),
});

const TesteSugeridoSchema = z.object({
    teste: z.string().describe('O nome do teste a ser realizado.'),
    descricao: z.string().describe('Uma breve descrição de como realizar o teste.'),
});

const ItemSchema = z.object({
    nome: z.string().describe('Nome da peça, ferramenta ou item.'),
    codigo: z.string().optional().describe('Código da peça, se aplicável.')
});

const DiagnosticoMotorOutputSchema = z.object({
    causasProvaveis: z.array(CausaProvavelSchema).describe('Uma lista de possíveis causas para os sintomas descritos.'),
    testesSugeridos: z.array(TesteSugeridoSchema).describe('Uma lista de testes de diagnóstico para confirmar a causa.'),
    pecasSugeridas: z.array(ItemSchema).describe('Uma lista de peças que podem precisar de substituição.'),
    observacoesAdicionais: z.string().optional().describe('Qualquer observação ou recomendação adicional que a IA julgar pertinente.')
});

export async function diagnosticarMotor(input: DiagnosticoMotorInput): Promise<DiagnosticoMotorOutput> {
    const { output } = await diagnosticoFlow(input);
    if (!output) {
      throw new Error("A IA não conseguiu gerar um diagnóstico válido.");
    }
    return output;
}

const diagnosticoPrompt = ai.definePrompt({
    name: 'diagnosticoMotorPrompt',
    input: { schema: z.object({
        sintomas: z.string(),
        codigosErro: z.string(),
        observacoes: z.string(),
    })},
    output: { 
        schema: DiagnosticoMotorOutputSchema,
    },
    prompt: `Você é um mecânico especialista em diagnóstico de motores com 30 anos de experiência, trabalhando em uma retífica de motores.
    
    Sua tarefa é analisar os dados fornecidos e gerar um plano de diagnóstico claro e acionável para um mecânico menos experiente.
    
    **Dados de Entrada:**
    - Sintomas do Veículo: {{{sintomas}}}
    - Códigos de Erro (DTCs): {{{codigosErro}}}
    - Observações Adicionais: {{{observacoes}}}
    
    **Seu Plano de Diagnóstico deve incluir:**
    1.  **Causas Prováveis:** Identifique as causas mais prováveis para os sintomas e códigos de erro. Classifique cada uma com probabilidade 'alta', 'media' ou 'baixa'.
    2.  **Testes Sugeridos:** Liste os testes específicos que o mecânico deve realizar para isolar o problema. Seja claro e objetivo na descrição dos testes.
    3.  **Peças Sugeridas:** Com base nas causas prováveis, liste as peças que têm maior chance de precisar de inspeção ou substituição.
    4.  **Observações Adicionais:** Forneça qualquer insight extra que sua experiência de 30 anos sugira. Pode ser uma dica, um aviso sobre um problema comum nesse tipo de motor, ou uma recomendação de sequência de testes.
    
    Seja técnico, preciso e direto ao ponto. O objetivo é economizar tempo e aumentar a precisão do diagnóstico na oficina.`,
});


const diagnosticoFlow = ai.defineFlow(
  {
    name: 'diagnosticoFlow',
    inputSchema: z.object({
        sintomas: z.string(),
        codigosErro: z.string(),
        observacoes: z.string(),
    }),
    outputSchema: DiagnosticoMotorOutputSchema,
  },
  async (input) => {
    const { output } = await diagnosticoPrompt(input, {model: googleAI.model('gemini-1.5-flash')});
    
    if (!output) {
      throw new Error("A IA não conseguiu gerar um diagnóstico válido.");
    }
    return output;
  }
);
