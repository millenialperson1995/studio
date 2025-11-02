"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Package, Wrench } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Peca, Servico } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ItemSelectorProps {
    pecas: Peca[];
    servicos: Servico[];
    onSelect: (item: Peca | Servico, type: 'peca' | 'servico') => void;
    trigger: React.ReactNode;
}

export function ItemSelector({ pecas, servicos, onSelect, trigger }: ItemSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const handleSelect = (item: Peca | Servico, type: 'peca' | 'servico') => {
    if (type === 'peca') {
        const peca = item as Peca;
        const estoqueDisponivel = peca.quantidadeEstoque - (peca.quantidadeReservada || 0);
        if (estoqueDisponivel <= 0) {
            toast({
                variant: 'destructive',
                title: 'Estoque Indisponível',
                description: `A peça "${peca.descricao}" não tem estoque disponível.`,
            });
            return;
        }
    }
    onSelect(item, type);
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar peça ou serviço..." />
          <CommandList>
            <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
            <CommandGroup heading="Serviços">
              {servicos.map((servico) => (
                <CommandItem
                  key={`servico-${servico.id}`}
                  value={servico.descricao}
                  onSelect={() => handleSelect(servico, 'servico')}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  {servico.descricao}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Peças">
              {pecas.map((peca) => {
                const estoqueDisponivel = peca.quantidadeEstoque - (peca.quantidadeReservada || 0);
                const isAvailable = estoqueDisponivel > 0;
                return (
                    <CommandItem
                    key={`peca-${peca.id}`}
                    value={peca.descricao}
                    onSelect={() => handleSelect(peca, 'peca')}
                    disabled={!isAvailable}
                    className={cn(!isAvailable && "text-muted-foreground")}
                    >
                    <Package className="mr-2 h-4 w-4" />
                    <div className="flex justify-between w-full">
                        <span>{peca.descricao}</span>
                        <span className={cn("text-xs", isAvailable ? 'text-green-600' : 'text-red-600')}>
                            {estoqueDisponivel} disp.
                        </span>
                    </div>
                    </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
