"use client"

import * as React from "react"
import { Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where } from 'firebase/firestore';

interface ResumosAutocompleteProps {
    value: string;
    onSelect: (value: string, price?: number) => void;
}

interface ItemOpcao {
    id: string;
    label: string;
    valor: number;
    tipo: 'servico' | 'peca';
}

export function ResumosAutocomplete({ value, onSelect }: ResumosAutocompleteProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const firestore = useFirestore();
    const { user } = useUser();

    // Sync inputValue with external value prop
    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Fetch Servicos
    const servicosRef = useMemoFirebase(
        () => (firestore && user?.uid ? query(collection(firestore, 'servicos'), where('userId', '==', user.uid)) : null),
        [firestore, user?.uid]
    );
    const { data: servicos, isLoading: loadingServicos } = useCollection<any>(servicosRef);

    // Fetch Pecas
    const pecasRef = useMemoFirebase(
        () => (firestore && user?.uid ? query(collection(firestore, 'pecas'), where('userId', '==', user.uid)) : null),
        [firestore, user?.uid]
    );
    const { data: pecas, isLoading: loadingPecas } = useCollection<any>(pecasRef);

    const options: ItemOpcao[] = React.useMemo(() => {
        const opts: ItemOpcao[] = [];
        if (servicos) {
            servicos.forEach(s => opts.push({
                id: `s-${s.id}`,
                label: s.descricao || '',
                valor: s.valorPadrao || 0,
                tipo: 'servico'
            }));
        }
        if (pecas) {
            pecas.forEach(p => opts.push({
                id: `p-${p.id}`,
                label: p.descricao || '',
                valor: p.valorVenda || 0,
                tipo: 'peca'
            }));
        }
        return opts.filter(o => o.label).sort((a, b) => a.label.localeCompare(b.label));
    }, [servicos, pecas]);

    const filteredOptions = React.useMemo(() => {
        if (!inputValue) return options;
        const search = inputValue.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(search));
    }, [options, inputValue]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectOption = (option: ItemOpcao) => {
        console.log('Selecting option:', option.label, option.valor);
        setInputValue(option.label);
        onSelect(option.label, option.valor);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsOpen(true);
        // If user is typing freely, update parent immediately
        onSelect(newValue);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleClear = () => {
        setInputValue('');
        onSelect('');
        setIsOpen(false);
    };

    const isLoading = loadingServicos || loadingPecas;

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder="Digite ou escolha..."
                    className="h-9 pr-8"
                />
                {inputValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                            {inputValue ? `Usando: "${inputValue}"` : 'Digite para buscar...'}
                        </div>
                    ) : (
                        <div className="py-1">
                            {filteredOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelectOption(option)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                                >
                                    <span className="truncate">{option.label}</span>
                                    <span className="ml-2 text-xs text-muted-foreground shrink-0">
                                        {option.tipo === 'servico' ? '🔧 Serviço' : '📦 Peça'} • R$ {option.valor.toFixed(2)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
