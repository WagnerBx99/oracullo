import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Dados mockados apenas para Indicadores de Qualidade (não temos dados reais)
const dadosQualidade = [
  { mes: 'Jul', conformidade: 96.5, retrabalho: 2.1, refugo: 1.4 },
  { mes: 'Ago', conformidade: 97.2, retrabalho: 1.8, refugo: 1.0 },
  { mes: 'Set', conformidade: 97.8, retrabalho: 1.5, refugo: 0.7 },
  { mes: 'Out', conformidade: 98.1, retrabalho: 1.3, refugo: 0.6 },
  { mes: 'Nov', conformidade: 98.5, retrabalho: 1.0, refugo: 0.5 },
  { mes: 'Dez', conformidade: 98.8, retrabalho: 0.8, refugo: 0.4 }
];

export default function Operacional() {
  const [periodo] = useState(new Date().getFullYear());

  // Buscar dados das APIs
  const { data: kpis = {} } = useQuery({
    queryKey: ['operacional-kpis', periodo],
    queryFn: () => api.operacional.kpis({ periodo }),
    initialData: {}
  });

  const { data: dadosProducao = [] } = useQuery({
    queryKey: ['operacional-producao', periodo],
    queryFn: () => api.operacional.producaoSemanal({ periodo }),
    initialData: []
  });

  const { data: dadosEntregas = [] } = useQuery({
    queryKey: ['operacional-entregas', periodo],
    queryFn: () => api.operacional.entregasPeriodo({ periodo }),
    initialData: []
  });

  const { data: dadosEstoque = [] } = useQuery({
    queryKey: ['operacional-estoque'],
    queryFn: () => api.operacional.estoque(),
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
          { 
            label: 'Eficiência Geral', 
            value: `${kpis.eficiencia_geral || 0}%`, 
            change: '+2.3%', 
            icon: TrendingUp, 
            color: 'green' 
          },
          { 
            label: 'Prazo Médio', 
            value: `${kpis.prazo_medio || 0} dias`, 
            change: '-15%', 
            icon: Clock, 
            color: 'blue' 
          },
          { 
            label: 'Taxa de Entrega', 
            value: `${kpis.taxa_entrega || 0}%`, 
            change: '+1.8%', 
            icon: CheckCircle, 
            color: 'orange' 
          },
          { 
            label: 'Não Conformidades', 
            value: `${kpis.nao_conformidades || 0}%`, 
            change: '-0.2%', 
            icon: AlertTriangle, 
            color: 'purple' 
          }
        ].map((kpi, index) => {
          const Icon = kpi.icon;
          const colorClasses = {
            green: 'bg-green-500/10 text-green-500',
            blue: 'bg-blue-500/10 text-blue-500',
            orange: 'bg-orange-500/10 text-orange-500',
            purple: 'bg-purple-500/10 text-purple-500'
          };

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-xl bg-card hover:shadow-2xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[kpi.color]} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant={kpi.change.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                      {kpi.change}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</h3>
                  <p className="text-3xl font-bold gradient-text">{kpi.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção: Planejado vs Realizado */}
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
                    <linearGradient id="colorPlanejado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#135670" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#135670" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="planejado" stroke="#135670" fill="url(#colorPlanejado)" name="Planejado" />
                  <Bar yAxisId="left" dataKey="realizado" fill="#ff5c00" name="Realizado" radius={[8, 8, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="eficiencia" stroke="#10b981" strokeWidth={2} name="Eficiência %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Entregas por Período */}
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
                  <Bar dataKey="entregas" stackId="a" fill="#135670" name="Entregas no Prazo" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="atraso" stackId="a" fill="#ef4444" name="Entregas Atrasadas" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores de Qualidade */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#10b981]" />
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
                  <Line type="monotone" dataKey="conformidade" stroke="#10b981" strokeWidth={2} name="Conformidade %" />
                  <Line type="monotone" dataKey="retrabalho" stroke="#f59e0b" strokeWidth={2} name="Retrabalho %" />
                  <Line type="monotone" dataKey="refugo" stroke="#ef4444" strokeWidth={2} name="Refugo %" />
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
              {dadosEstoque.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosEstoque} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="categoria" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="nivel" fill="#135670" name="Nível Atual" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="minimo" fill="#f59e0b" name="Mínimo" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="maximo" fill="#10b981" name="Máximo" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Sem dados de estoque por categoria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
