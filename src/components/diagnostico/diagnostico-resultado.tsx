'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiagnosticoMotorOutput } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Lightbulb, Wrench, HardHat } from "lucide-react";

interface DiagnosticoResultadoProps {
    resultado: DiagnosticoMotorOutput | null;
    isLoading: boolean;
}

const ProbabilidadeBadge = ({ prob }: { prob: 'alta' | 'media' | 'baixa' }) => {
    const variants = {
        alta: { variant: 'destructive', text: 'Alta' },
        media: { variant: 'default', text: 'Média' },
        baixa: { variant: 'secondary', text: 'Baixa' },
    } as const;

    const { variant, text } = variants[prob] || variants.baixa;

    return <Badge variant={variant}>{text}</Badge>;
}

export function DiagnosticoResultado({ resultado, isLoading }: DiagnosticoResultadoProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                 <Skeleton className="h-24 w-full" />
            </div>
        );
    }
    
    if (!resultado) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                <p className="text-muted-foreground">Aguardando informações para o diagnóstico...</p>
            </div>
        );
    }

    return (
        <Accordion type="multiple" defaultValue={["causas", "testes"]} className="w-full">
            {resultado.causasProvaveis && resultado.causasProvaveis.length > 0 && (
                 <AccordionItem value="causas">
                    <AccordionTrigger className="text-base font-semibold">
                        <div className="flex items-center gap-2">
                           <Lightbulb className="h-5 w-5" />
                            Causas Prováveis
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                       <ul className="space-y-3 pl-2">
                            {resultado.causasProvaveis.map((item, index) => (
                                <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                                    <span>{item.causa}</span>
                                    <ProbabilidadeBadge prob={item.probabilidade} />
                                </li>
                            ))}
                       </ul>
                    </AccordionContent>
                </AccordionItem>
            )}

            {resultado.testesSugeridos && resultado.testesSugeridos.length > 0 && (
                <AccordionItem value="testes">
                    <AccordionTrigger className="text-base font-semibold">
                        <div className="flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            Testes Sugeridos
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-2 pl-2 list-disc list-inside">
                             {resultado.testesSugeridos.map((item, index) => (
                                <li key={index} className="text-sm">
                                    <span className="font-medium">{item.teste}:</span>
                                    <span className="text-muted-foreground ml-1">{item.descricao}</span>
                                </li>
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            )}

            {resultado.pecasSugeridas && resultado.pecasSugeridas.length > 0 && (
                <AccordionItem value="pecas">
                    <AccordionTrigger className="text-base font-semibold">
                         <div className="flex items-center gap-2">
                            <HardHat className="h-5 w-5" />
                            Peças/Itens Sugeridos
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                         <ul className="space-y-2 pl-2 list-disc list-inside">
                             {resultado.pecasSugeridas.map((item, index) => (
                                <li key={index} className="text-sm">
                                    {item.nome}
                                    {item.codigo && <span className="text-muted-foreground ml-2">(Cód: {item.codigo})</span>}
                                </li>
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            )}

             {resultado.observacoesAdicionais && (
                <div className="mt-4 p-4 border-l-4 border-primary bg-primary/10 rounded-r-lg">
                    <h4 className="font-semibold mb-2">Observações da IA</h4>
                    <p className="text-sm text-foreground/80">{resultado.observacoesAdicionais}</p>
                </div>
            )}
        </Accordion>
    )
}
