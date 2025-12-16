import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tantml:react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const dadosProducao = [
  { dia: 'Seg', planejado: 450, realizado: 425, eficiencia: 94 },
  { dia: 'Ter', planejado: 450, realizado: 465, eficiencia: 103 },
  { dia: 'Qua', planejado: 450, realizado: 438, eficiencia: 97 },
  { dia: 'Qui', planejado: 450, realizado: 472, eficiencia: 105 },
  { dia: 'Sex', planejado: 450, realizado: 455, eficiencia: 101 },
  { dia: 'Sáb', planejado: 300, realizado: 295, eficiencia: 98 }
];

const dadosEntregas = [
  { periodo: '00-06h', entregas: 12, atraso: 1 },
  { periodo: '06-12h', entregas: 45, atraso: 3 },
  { periodo: '12-18h', entregas: 68, atraso: 5 },
  { periodo: '18-24h', entregas: 34, atraso: 2 }
];

const dadosQualidade = [
  { mes: 'Jul', conformidade: 96.5, retrabalho: 2.1, refugo: 1.4 },
  { mes: 'Ago', conformidade: 97.2, retrabalho: 1.8, refugo: 1.0 },
  { mes: 'Set', conformidade: 97.8, retrabalho: 1.5, refugo: 0.7 },
  { mes: 'Out', conformidade: 98.1, retrabalho: 1.3, refugo: 0.6 },
  { mes: 'Nov', conformidade: 98.5, retrabalho: 1.0, refugo: 0.5 },
  { mes: 'Dez', conformidade: 98.8, retrabalho: 0.8, refugo: 0.4 }
];

const dadosEstoque = [
  { categoria: 'Matéria Prima', nivel: 85, minimo: 70, maximo: 100 },
  { categoria: 'Em Processo', nivel: 45, minimo: 30, maximo: 60 },
  { categoria: 'Produto Acabado', nivel: 92, minimo: 80, maximo: 120 },
  { categoria: 'Embalagens', nivel: 78, minimo: 65, maximo: 90 }
];

export default function Operacional() {
  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => base44.entities.KPI.list('-created_date'),
    initialData: []
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-lg shadow-xl border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString('pt-BR')}
              {entry.name.includes('%') || entry.name.includes('eficiencia') ? '%' : ''}
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
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard Operacional</h1>
            <p className="text-muted-foreground">Indicadores de produção, logística e qualidade</p>
          </div>
        </div>
      </motion.div>

      {/* KPIs Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Eficiência Geral', value: '98.8%', change: '+2.3%', icon: TrendingUp, color: 'green' },
          { label: 'Prazo Médio', value: '3.2 dias', change: '-15%', icon: Clock, color: 'blue' },
          { label: 'Taxa de Entrega', value: '96.5%', change: '+1.8%', icon: CheckCircle, color: 'orange' },
          { label: 'Não Conformidades', value: '0.4%', change: '-0.2%', icon: AlertTriangle, color: 'purple' }
        ].map((kpi, index) => {
          const Icon = kpi.icon;
          const colorClasses = {
            green: 'from-emerald-500 to-emerald-600',
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
              <Card className="border-0 shadow-lg hover:shadow-2xl transition-all bg-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[kpi.color]} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
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
        {/* Produção vs Planejado */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-[#135670]" />
              Produção: Planejado vs Realizado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosProducao}>
                  <defs>
                    <linearGradient id="colorEficiencia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="planejado" 
                    fill="#94a3b8" 
                    name="Planejado"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="realizado" 
                    fill="#135670" 
                    name="Realizado"
                    radius={[8, 8, 0, 0]}
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="eficiencia" 
                    fill="url(#colorEficiencia)" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Eficiência %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Entregas e Atrasos */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#ff5c00]" />
              Entregas por Período
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosEntregas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="entregas" stackId="a" fill="#135670" name="Entregas no Prazo" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="atraso" stackId="a" fill="#ef4444" name="Entregas Atrasadas" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qualidade */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Indicadores de Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosQualidade}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="conformidade" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    name="Conformidade %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="retrabalho" 
                    stroke="#ff5c00" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Retrabalho %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="refugo" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Refugo %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Níveis de Estoque */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-[#135670]" />
              Níveis de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosEstoque} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="categoria" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="nivel" fill="#135670" name="Nível Atual" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="minimo" fill="#f59e0b" name="Mínimo" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="maximo" fill="#10b981" name="Máximo" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}