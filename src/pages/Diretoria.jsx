import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Briefcase } from 'lucide-react';
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#135670', '#ff5c00', '#10b981', '#8b5cf6', '#f59e0b'];

const dadosFaturamento = [
  { mes: 'Jul', faturamento: 245000, meta: 250000, lucro: 92000 },
  { mes: 'Ago', faturamento: 268000, meta: 260000, lucro: 101000 },
  { mes: 'Set', faturamento: 282000, meta: 270000, lucro: 108000 },
  { mes: 'Out', faturamento: 291000, meta: 280000, lucro: 112000 },
  { mes: 'Nov', faturamento: 305000, meta: 290000, lucro: 118000 },
  { mes: 'Dez', faturamento: 320000, meta: 300000, lucro: 125000 }
];

const dadosPerformance = [
  { categoria: 'Vendas', valor: 92 },
  { categoria: 'Operações', valor: 85 },
  { categoria: 'Financeiro', valor: 88 },
  { categoria: 'Satisfação', valor: 90 },
  { categoria: 'Qualidade', valor: 87 },
];

const dadosDistribuicao = [
  { name: 'Produtos', value: 45 },
  { name: 'Serviços', value: 30 },
  { name: 'Consultoria', value: 15 },
  { name: 'Outros', value: 10 }
];

const dadosComparativo = [
  { periodo: 'Q1', atual: 850000, anterior: 780000 },
  { periodo: 'Q2', atual: 920000, anterior: 850000 },
  { periodo: 'Q3', atual: 985000, anterior: 890000 },
  { periodo: 'Q4', atual: 1050000, anterior: 950000 }
];

export default function Diretoria() {
  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => base44.entities.KPI.list('-created_date'),
    initialData: []
  });

  const kpisDiretoria = kpis.filter(k => k.area_responsavel === 'diretoria');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-lg shadow-xl border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {entry.value?.toLocaleString('pt-BR')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#135670] to-[#ff5c00] flex items-center justify-center shadow-lg">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Visão Diretoria</h1>
            <p className="text-muted-foreground">Indicadores estratégicos e performance geral</p>
          </div>
        </div>
      </motion.div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Anual', value: 'R$ 3,2M', change: '+12.5%', positive: true, icon: DollarSign, color: 'emerald' },
          { label: 'Margem Operacional', value: '38.5%', change: '+2.3%', positive: true, icon: TrendingUp, color: 'blue' },
          { label: 'ROI Geral', value: '24.8%', change: '+1.8%', positive: true, icon: Target, color: 'orange' },
          { label: 'Crescimento', value: '15.2%', change: '+3.1%', positive: true, icon: Users, color: 'purple' }
        ].map((kpi, index) => {
          const Icon = kpi.icon;
          const colorClasses = {
            emerald: 'from-emerald-500 to-emerald-600',
            blue: 'from-[#135670] to-[#1a7a9e]',
            orange: 'from-[#ff5c00] to-orange-600',
            purple: 'from-purple-500 to-purple-600'
          };
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-2xl transition-all bg-card group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[kpi.color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={kpi.positive ? "default" : "destructive"} className="gap-1">
                      {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {kpi.change}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento e Meta */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Faturamento vs Meta</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosFaturamento}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#135670" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#135670" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="faturamento" 
                    fill="url(#colorFaturamento)" 
                    stroke="#135670" 
                    strokeWidth={2}
                    name="Faturamento"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="#ff5c00" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Meta"
                  />
                  <Bar dataKey="lucro" fill="#10b981" name="Lucro Líquido" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Índice de Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={dadosPerformance}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="categoria" stroke="hsl(var(--muted-foreground))" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Radar 
                    name="Performance" 
                    dataKey="valor" 
                    stroke="#135670" 
                    fill="#135670" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Receita */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Distribuição de Receita</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosDistribuicao}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                  >
                    {dadosDistribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comparativo Trimestral */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Comparativo Ano a Ano</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosComparativo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="anterior" fill="#94a3b8" name="2024" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="atual" fill="#135670" name="2025" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}