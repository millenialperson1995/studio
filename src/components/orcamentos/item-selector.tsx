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

interface ItemSelectorProps {
    pecas: Peca[];
    servicos: Servico[];
    onSelect: (item: Peca | Servico, type: 'peca' | 'servico') => void;
    trigger: React.ReactNode;
}

export function ItemSelector({ pecas, servicos, onSelect, trigger }: ItemSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (item: Peca | Servico, type: 'peca' | 'servico') => {
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
              {pecas.map((peca) => (
                <CommandItem
                  key={`peca-${peca.id}`}
                  value={peca.descricao}
                  onSelect={() => handleSelect(peca, 'peca')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  {peca.descricao}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
