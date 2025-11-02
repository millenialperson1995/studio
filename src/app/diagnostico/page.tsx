'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where } from 'firebase/firestore';
import { Sparkles, Bot, CheckCircle2, Wrench, Package, Mic, Waves } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import type { Peca, Servico, DiagnosticoMotorOutput } from '@/lib/types';
import { diagnosticarMotor } from '@/ai/flows/diagnostico-fluxo';
import { transcreverAudio } from '@/ai/flows/transcricao-fluxo';

const formSchema = z.object({
  motorInfo: z.string().min(3, 'Por favor, forneça informações sobre o motor.'),
  sintomas: z.string().min(10, 'Por favor, descreva os sintomas com mais detalhes.'),
});

function DiagnosticoContent() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [analise, setAnalise] = useState<DiagnosticoMotorOutput | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Carregar catálogos de serviços e peças
  const servicosQuery = useMemoFirebase(() => (firestore && user?.uid ? query(collection(firestore, 'servicos'), where('userId', '==', user.uid)) : null), [firestore, user?.uid]);
  const pecasQuery = useMemoFirebase(() => (firestore && user?.uid ? query(collection(firestore, 'pecas'), where('userId', '==', user.uid)) : null), [firestore, user?.uid]);
  
  const { data: servicos, isLoading: isLoadingServicos } = useCollection<Servico>(servicosQuery);
  const { data: pecas, isLoading: isLoadingPecas } = useCollection<Peca>(pecasQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motorInfo: '',
      sintomas: '',
    },
  });

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsTranscribing(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
              const result = await transcreverAudio({ audioDataUri: base64Audio });
              const currentSintomas = form.getValues('sintomas');
              form.setValue('sintomas', (currentSintomas ? currentSintomas + ' ' : '') + result.texto, { shouldValidate: true });
            } catch (e: any) {
              console.error("Erro na transcrição:", e);
              toast({ variant: "destructive", title: "Erro de Transcrição", description: e.message || "Não foi possível transcrever o áudio."});
            } finally {
              setIsTranscribing(false);
            }
          };
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Erro ao acessar o microfone:", err);
        toast({ variant: "destructive", title: "Erro de Microfone", description: "Não foi possível acessar seu microfone. Verifique as permissões do navegador."});
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!servicos || !pecas) {
      setError('Catálogo de serviços ou peças não carregado. Tente novamente.');
      return;
    }
    
    setIsAnalysing(true);
    setError(null);
    setAnalise(null);

    try {
        const input = {
            ...values,
            servicosDisponiveis: servicos.map(s => ({ codigo: s.codigo, descricao: s.descricao })),
            pecasDisponiveis: pecas.map(p => ({ codigo: p.codigo, descricao: p.descricao })),
        };
        const result = await diagnosticarMotor(input);
        setAnalise(result);
    } catch (e: any) {
        console.error("Erro no diagnóstico com IA:", e);
        setError(e.message || 'Ocorreu um erro ao consultar a IA. Tente novamente.');
    } finally {
        setIsAnalysing(false);
    }
  };

  const isLoadingCatalogo = isLoadingServicos || isLoadingPecas;

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Diagnóstico com Inteligência Artificial</h1>
          <p className="text-muted-foreground">Descreva o problema do motor para receber um plano de ação sugerido.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Análise do Motor</CardTitle>
            <CardDescription>Forneça os detalhes abaixo para que a IA possa gerar um diagnóstico.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="motorInfo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informações do Motor</FormLabel>
                    <FormControl><Input placeholder="Ex: VW AP 1.8, Fiat Fire 1.0 8v" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sintomas" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sintomas Observados</FormLabel>
                    <div className="relative">
                      <FormControl><Textarea placeholder="Ex: Superaqueceu, fumaça azul saindo do escapamento, perda de potência em subidas..." className="min-h-[100px] pr-12" {...field} /></FormControl>
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8",
                            isRecording && "bg-red-500/20 text-red-500 animate-pulse"
                          )}
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onTouchStart={startRecording}
                          onTouchEnd={stopRecording}
                          disabled={isTranscribing}
                        >
                          {isTranscribing ? <Waves className="h-5 w-5 animate-ping" /> : <Mic className="h-5 w-5" />}
                          <span className="sr-only">Gravar áudio</span>
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isAnalysing || isLoadingCatalogo || isRecording || isTranscribing}>
                  {isLoadingCatalogo ? 'Carregando catálogo...' : isAnalysing ? 'Analisando...' : isTranscribing ? 'Transcrevendo...' : <><Sparkles className="mr-2 h-4 w-4" /> Analisar com IA</>}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
            <div className="flex items-center gap-3 text-xl font-semibold">
                <Bot className="h-7 w-7 text-primary" />
                <h2>Resultado da Análise</h2>
            </div>
            {isAnalysing && (
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Separator className="my-4"/>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            )}
            {error && (
                 <Alert variant="destructive">
                    <AlertTitle>Erro na Análise</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {analise ? (
                <Card className="bg-secondary/30">
                    <CardHeader>
                         <Alert className="border-primary/50 bg-primary/10">
                            <AlertTitle className="font-semibold text-primary">Diagnóstico Provável</AlertTitle>
                            <AlertDescription className="text-foreground">
                                {analise.diagnosticoProvavel}
                            </AlertDescription>
                        </Alert>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600"/>Plano de Ação Sugerido</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                {analise.planoDeAcao.map((passo, i) => <li key={i}>{passo.passo} {passo.isCritico && <strong className="text-destructive">(Crítico)</strong>}</li>)}
                            </ul>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Wrench className="h-5 w-5 text-sky-600"/>Serviços Recomendados</h3>
                             <div className="flex flex-wrap gap-2">
                                {analise.servicosSugeridos.map((s, i) => <Badge key={i} variant="secondary">{s.descricao}</Badge>)}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Package className="h-5 w-5 text-amber-600"/>Peças Provavelmente Necessárias</h3>
                             <div className="flex flex-wrap gap-2">
                                {analise.pecasSugeridas.map((p, i) => <Badge key={i} variant="outline">{p.descricao}</Badge>)}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <p className="text-xs text-muted-foreground text-center w-full">Atenção: Este é um diagnóstico sugerido por IA e deve ser usado como um auxílio. A inspeção por um profissional qualificado é indispensável.</p>
                    </CardFooter>
                </Card>
            ) : !isAnalysing && (
                <Card className="flex flex-col items-center justify-center p-10 text-center">
                    <CardContent>
                        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">O resultado da análise da IA aparecerá aqui.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </main>
  );
}

export default function DiagnosticoPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <SidebarProvider>
        <Sidebar><AppSidebar /></Sidebar>
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            <Skeleton className="h-8 w-1/2 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <DiagnosticoContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
