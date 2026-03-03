'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { Cliente } from '@/lib/types';

interface ClienteComboboxProps {
    clientes: Cliente[];
    value: string;
    onChange: (clienteId: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function ClienteCombobox({
    clientes,
    value,
    onChange,
    placeholder = 'Selecione um cliente',
    disabled = false,
}: ClienteComboboxProps) {
    const [open, setOpen] = useState(false);

    const selectedCliente = clientes.find((c) => c.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground'
                    )}
                >
                    {selectedCliente ? selectedCliente.nome : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Digite o nome do cliente..." />
                    <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                            {clientes.map((cliente) => (
                                <CommandItem
                                    key={cliente.id}
                                    value={cliente.nome}
                                    onSelect={() => {
                                        onChange(cliente.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === cliente.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {cliente.nome}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
