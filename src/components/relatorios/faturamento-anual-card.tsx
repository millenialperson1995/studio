'use client';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--primary))',
  },
};

interface FaturamentoAnualCardProps {
    data: { month: string; revenue: number }[];
}

const formatCurrency = (value: number) => {
    if (value >= 1000) {
        return `R$${(value / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
    }
    return `R$${value.toLocaleString('pt-BR')}`;
}


export default function FaturamentoAnualCard({ data }: FaturamentoAnualCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento Mensal</CardTitle>
        <CardDescription>Receita de ordens concluídas nos últimos 12 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(Number(value))}
              />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2})}`}
                    indicator="dot"
                />}
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
