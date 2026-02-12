import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Briefcase } from 'lucide-react';
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { api } from '@/api/apiClient';

const COLORS = ['#135670', '#ff5c00', '#10b981', '#8b5cf6', '#f59e0b'];

export default function Diretoria() {
  // Buscar KPIs da diretoria
  const { data: kpisData, isLoading: loadingKpis } = useQuery({
    queryKey: ['diretoria-kpis'],
    queryFn: () => api.diretoria.kpis(),
    refetchInterval: 300000, // Atualizar a cada 5 minutos
  });

  // Buscar faturamento mensal
  const { data: dadosFaturamento = [], isLoading: loadingFaturamento } = useQuery({
    queryKey: ['diretoria-faturamento-mensal'],
    queryFn: () => api.diretoria.faturamentoMensal({ meses: 6 }),
    refetchInterval: 300000,
  });

  // Buscar performance
  const { data: dadosPerformance = [], isLoading: loadingPerformance } = useQuery({
    queryKey: ['diretoria-performance'],
    queryFn: () => api.diretoria.performance(),
    refetchInterval: 300000,
  });

  // Buscar distribuição de receita
  const { data: dadosDistribuicao = [], isLoading: loadingDistribuicao } = useQuery({
    queryKey: ['diretoria-distribuicao'],
    queryFn: () => api.diretoria.distribuicaoReceita({ ano: new Date().getFullYear() }),
    refetchInterval: 300000,
  });

  // Buscar comparativo trimestral
  const { data: dadosComparativo = [], isLoading: loadingComparativo } = useQuery({
    queryKey: ['diretoria-comparativo'],
    queryFn: () => api.diretoria.comparativoTrimestral({
      ano_atual: new Date().getFullYear(),
      ano_anterior: new Date().getFullYear() - 1
    }),
    refetchInterval: 300000,
  });

  // Formatar valores
  const formatCurrency = (value) => {
    if (!value) return 'R$ 0';
    if (value >= 1000000) {
      return `R$ ${Number((value / 1000000) || 0).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${Number((value / 1000) || 0).toFixed(0)}K`;
    }
    return `R$ ${Number(value || 0).toFixed(0)}`;
  };

  const formatPercent = (value) => {
    if (!value && value !== 0) return '0%';
    return `${Number(value || 0).toFixed(1)}%`;
  };

  // KPIs para os cards
  const kpisCards = [
    {
      label: 'Faturamento Anual',
      value: formatCurrency(kpisData?.faturamento_anual || 0),
      change: `${kpisData?.variacao_faturamento > 0 ? '+' : ''}${formatPercent(kpisData?.variacao_faturamento || 0)}`,
      positive: (kpisData?.variacao_faturamento || 0) >= 0,
      icon: DollarSign,
      color: 'emerald'
    },
    {
      label: 'Margem Operacional',
      value: formatPercent(kpisData?.margem_operacional || 0),
      change: `${kpisData?.variacao_margem > 0 ? '+' : ''}${formatPercent(kpisData?.variacao_margem || 0)}`,
      positive: (kpisData?.variacao_margem || 0) >= 0,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      label: 'ROI Geral',
      value: formatPercent(kpisData?.roi_geral || 0),
      change: `${kpisData?.variacao_roi > 0 ? '+' : ''}${formatPercent(kpisData?.variacao_roi || 0)}`,
      positive: (kpisData?.variacao_roi || 0) >= 0,
      icon: Target,
      color: 'orange'
    },
    {
      label: 'Crescimento',
      value: formatPercent(kpisData?.crescimento || 0),
      change: `${kpisData?.variacao_crescimento > 0 ? '+' : ''}${formatPercent(kpisData?.variacao_crescimento || 0)}`,
      positive: (kpisData?.variacao_crescimento || 0) >= 0,
      icon: Users,
      color: 'purple'
    }
  ];

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

  const isLoading = loadingKpis || loadingFaturamento || loadingPerformance || loadingDistribuicao || loadingComparativo;

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
        {kpisCards.map((kpi, index) => {
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
                  {isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-12 w-12 bg-muted rounded-xl mb-4"></div>
                      <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-32"></div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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
            {loadingFaturamento ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Índice de Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingPerformance ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
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
            )}
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
            {loadingDistribuicao ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Comparativo Trimestral */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Comparativo Ano a Ano</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingComparativo ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosComparativo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="anterior" fill="#94a3b8" name={new Date().getFullYear() - 1} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="atual" fill="#135670" name={new Date().getFullYear()} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
