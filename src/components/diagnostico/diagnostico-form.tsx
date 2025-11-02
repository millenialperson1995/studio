'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { diagnosticarMotor } from '@/ai/flows/diagnostico-fluxo';
import type { DiagnosticoMotorOutput } from '@/lib/types';
import { Wand2 } from 'lucide-react';

const formSchema = z.object({
  sintomas: z.string().min(10, 'Descreva os sintomas com pelo menos 10 caracteres.'),
  codigosErro: z.string().optional(),
  observacoes: z.string().optional(),
});

interface DiagnosticoFormProps {
    setResultado: (resultado: DiagnosticoMotorOutput | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    isLoading: boolean;
}

export function DiagnosticoForm({ setResultado, setIsLoading, isLoading }: DiagnosticoFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sintomas: '',
      codigosErro: '',
      observacoes: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResultado(null);
    try {
        const resultadoDiagnostico = await diagnosticarMotor(values);
        setResultado(resultadoDiagnostico);
    } catch (error) {
      console.error('Error getting diagnosis: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Diagnóstico',
        description: 'Não foi possível obter um diagnóstico da IA. Verifique sua chave de API e tente novamente.',
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sintomas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sintomas do Veículo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Motor falhando em baixa rotação, fumaça branca no escapamento, perda de potência..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="codigosErro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Códigos de Erro (DTCs)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: P0300, P0420, P0171"
                  className="resize-y"
                  {...field}
                />
              </FormControl>
               <p className="text-[0.8rem] text-muted-foreground">
                Se houver, insira os códigos de erro lidos pelo scanner.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações Adicionais</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: O problema acontece apenas com o motor frio, barulho de metal batendo, etc."
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isLoading}>
             <Wand2 className="mr-2 h-4 w-4" />
            {isLoading ? 'Analisando...' : 'Diagnosticar com IA'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
