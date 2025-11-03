import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OrdemServico, Orcamento } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

type EnrichedItem = (Orcamento | OrdemServico) & { clienteNome: string };

interface RecentActivityCardProps {
  title: string;
  items: EnrichedItem[];
  icon: React.ReactNode;
  emptyMessage: string;
}

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  andamento: 'default',
  concluida: 'secondary',
  pendente: 'outline',
  cancelada: 'destructive',
  aprovado: 'default',
  rejeitado: 'destructive',
};

const statusLabelMap: { [key: string]: string } = {
  andamento: 'Em Andamento',
  concluida: 'Concluída',
  pendente: 'Pendente',
  cancelada: 'Cancelada',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

export default function RecentActivityCard({ title, items, icon, emptyMessage }: RecentActivityCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        {icon}
        <div className="grid gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{items.length} {items.length === 1 ? 'item' : 'itens'} no total</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4 pr-4">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarFallback>{item.clienteNome?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1 flex-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {item.clienteNome || 'Cliente não encontrado'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      ID: {item.id.substring(0, 8)}...
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-medium">R$ {item.valorTotal.toLocaleString('pt-BR')}</div>
                     <Badge variant={statusVariantMap[item.status]} className="text-xs mt-1">
                        {statusLabelMap[item.status]}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    {emptyMessage}
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
