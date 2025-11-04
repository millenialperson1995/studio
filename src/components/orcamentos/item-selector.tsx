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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Peca, Servico } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "../ui/scroll-area"

interface ItemSelectorProps {
    pecas: Peca[];
    servicos: Servico[];
    onSelect: (item: Peca | Servico, type: 'peca' | 'servico') => void;
    trigger: React.ReactNode;
    selectedItemIds: string[];
}

export function ItemSelector({ pecas, servicos, onSelect, trigger, selectedItemIds }: ItemSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const handleSelect = (item: Peca | Servico, type: 'peca' | 'servico') => {
    onSelect(item, type);
    setOpen(false)
  }
  
  const filteredServicos = servicos.filter(s => !selectedItemIds.includes(s.id));
  const filteredPecas = pecas.filter(p => !selectedItemIds.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Adicionar Item</DialogTitle>
          </DialogHeader>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput placeholder="Buscar por código ou descrição..." />
            <ScrollArea className="h-[400px]">
              <CommandList>
                <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                {filteredServicos.length > 0 && (
                  <CommandGroup heading="Serviços">
                    {filteredServicos.map((servico) => (
                      <CommandItem
                        key={`servico-${servico.id}`}
                        value={`${servico.descricao} ${servico.codigo}`}
                        onSelect={() => handleSelect(servico, 'servico')}
                      >
                        <Wrench className="mr-2 h-4 w-4 flex-shrink-0" />
                        <div className="flex justify-between w-full">
                            <span className="truncate">{servico.descricao}</span>
                            <span className="text-xs text-muted-foreground ml-2">{servico.codigo}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {filteredPecas.length > 0 && filteredServicos.length > 0 && <CommandSeparator />}

                {filteredPecas.length > 0 && (
                  <CommandGroup heading="Peças">
                    {filteredPecas.map((peca) => {
                      const estoqueDisponivel = peca.quantidadeEstoque - (peca.quantidadeReservada || 0);
                      const isAvailable = estoqueDisponivel > 0;
                      return (
                          <CommandItem
                          key={`peca-${peca.id}`}
                          value={`${peca.descricao} ${peca.codigo}`}
                          onSelect={() => handleSelect(peca, 'peca')}
                          >
                          <Package className="mr-2 h-4 w-4 flex-shrink-0" />
                          <div className="flex justify-between w-full items-center">
                              <div className="flex flex-col truncate">
                                <span className="truncate">{peca.descricao}</span>
                                <span className="text-xs text-muted-foreground">{peca.codigo}</span>
                              </div>
                              <span className={cn("text-xs ml-2 flex-shrink-0", isAvailable ? 'text-green-600' : 'text-red-600')}>
                                  {estoqueDisponivel} disp.
                              </span>
                          </div>
                          </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </ScrollArea>
          </Command>
      </DialogContent>
    </Dialog>
  )
}
