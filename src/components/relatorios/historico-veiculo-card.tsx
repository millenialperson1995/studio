'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronsUpDown, Car } from 'lucide-react';
import type { Cliente, Veiculo, OrdemServico } from '@/lib/types';
import HistoricoVeiculoDialog from './historico-veiculo-dialog';

interface HistoricoVeiculoCardProps {
    vehicles: Veiculo[];
    clients: Cliente[];
    ordensServico: OrdemServico[];
}

export default function HistoricoVeiculoCard({ vehicles, clients, ordensServico }: HistoricoVeiculoCardProps) {
    const [openPopover, setOpenPopover] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Veiculo | null>(null);

    const clientsMap = new Map(clients.map(c => [c.id, c.nome]));

    const handleSelectVehicle = (vehicle: Veiculo) => {
        setSelectedVehicle(vehicle);
        setOpenPopover(false);
        setOpenDialog(true);
    };

    const vehicleHistory = selectedVehicle 
        ? ordensServico.filter(os => os.veiculoId === selectedVehicle.id)
        : [];

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Histórico de Veículo</CardTitle>
                <CardDescription>Selecione um veículo para ver seu histórico completo de ordens de serviço.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
                <Car className="w-16 h-16 text-muted-foreground" />
                <Popover open={openPopover} onOpenChange={setOpenPopover}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openPopover} className="w-[300px] justify-between">
                            {selectedVehicle
                                ? `${selectedVehicle.placa} - ${selectedVehicle.fabricante} ${selectedVehicle.modelo}`
                                : "Selecione um veículo..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar veículo (placa, modelo...)" />
                            <CommandList>
                                <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                                <CommandGroup>
                                    {vehicles.map((vehicle) => (
                                        <CommandItem
                                            key={vehicle.id}
                                            value={`${vehicle.placa} ${vehicle.fabricante} ${vehicle.modelo}`}
                                            onSelect={() => handleSelectVehicle(vehicle)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{vehicle.placa} - {vehicle.fabricante} {vehicle.modelo}</span>
                                                <span className="text-xs text-muted-foreground">{clientsMap.get(vehicle.clienteId)}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                 <p className="text-sm text-muted-foreground">
                    Total de veículos cadastrados: {vehicles.length}
                </p>
            </CardContent>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-4xl">
                     <DialogHeader>
                        <DialogTitle>Histórico do Veículo: {selectedVehicle?.placa}</DialogTitle>
                        <DialogDescription>
                            {selectedVehicle?.fabricante} {selectedVehicle?.modelo} - Proprietário: {clientsMap.get(selectedVehicle?.clienteId || '')}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedVehicle && <HistoricoVeiculoDialog ordens={vehicleHistory} />}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
