import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { safeFixed, formatCurrency } from '@/utils/formatters';

export default function MargemChart({ produtos }) {
  const data = produtos.slice(0, 10).map(p => ({
    nome: p.nome?.substring(0, 15) + (p.nome?.length > 15 ? '...' : ''),
    margem: p.custo && p.preco_venda ? ((p.preco_venda - p.custo) / p.preco_venda * 100) : 0,
    custo: p.custo || 0,
    venda: p.preco_venda || 0
  }));

  const getBarColor = (margem) => {
    if (margem >= 40) return '#10b981';
    if (margem >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-xl shadow-xl border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Margem: <span className="font-medium text-foreground">{safeFixed(payload[0].value, 1)}%</span></p>
            <p className="text-muted-foreground">Custo: <span className="font-medium text-foreground">{formatCurrency(payload[0].payload.custo)}</span></p>
            <p className="text-muted-foreground">Venda: <span className="font-medium text-foreground">{formatCurrency(payload[0].payload.venda)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-xl font-bold text-foreground">
          Margem por Produto
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                tickFormatter={(val) => `${val}%`}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="nome" 
                width={100}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="margem" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.margem)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Ótima (≥40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Regular (25-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Baixa (&lt;25%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}