'use client';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LabelList
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  total: {
    label: 'Receita Total',
    color: 'hsl(var(--chart-3))',
  },
};

interface ReceitaClienteCardProps {
  data: { name: string; total: number }[];
}

const formatCurrency = (value: number) => `R$${value.toLocaleString('pt-BR')}`;

export default function ReceitaClienteCard({ data }: ReceitaClienteCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Mais Valiosos</CardTitle>
        <CardDescription>Top 5 clientes por receita total gerada.</CardDescription>
      </CardHeader>
      <CardContent>
         {data.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
                >
                <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                     tickFormatter={(value) => value.length > 12 ? `${value.substring(0,12)}...` : value}
                />
                <XAxis type="number" hide />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={
                    <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                        indicator="dot"
                    />
                    }
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={4}>
                     <LabelList 
                        dataKey="total" 
                        position="right" 
                        offset={8} 
                        className="fill-foreground"
                        fontSize={12}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
         ) : (
            <div className="flex h-[350px] w-full items-center justify-center">
                <p className="text-muted-foreground">Nenhuma receita de clientes encontrada.</p>
            </div>
         )}
      </CardContent>
    </Card>
  );
}
