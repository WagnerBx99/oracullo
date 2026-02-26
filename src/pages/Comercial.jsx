import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, TrendingUp, Users, Target, Award, Zap } from 'lucide-react';
import { motion } from "framer-motion";
import { Area, Line, BarChart, Bar,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ScatterChart, Scatter
} from 'recharts';

export default function Comercial() {
  const [periodo] = useState(new Date().getFullYear());

  // Buscar dados das APIs
  const { data: kpis = {} } = useQuery({
    queryKey: ['comercial-kpis', periodo],
    queryFn: () => api.comercial.kpis({ periodo }),
    initialData: {}
  });

  const { data: vendasMensais = [] } = useQuery({
    queryKey: ['comercial-vendas-mensais', periodo],
    queryFn: () => api.comercial.vendasMensais({ periodo }),
    initialData: []
  });

  const { data: pipeline = [] } = useQuery({
    queryKey: ['comercial-pipeline', periodo],
    queryFn: () => api.comercial.pipeline({ periodo }),
    initialData: []
  });

  const { data: topProdutos = [] } = useQuery({
    queryKey: ['comercial-top-produtos', periodo],
    queryFn: () => api.comercial.topProdutos({ periodo, limit: 5 }),
    initialData: []
  });

  const { data: vendedores = [] } = useQuery({
    queryKey: ['comercial-vendedores', periodo],
    queryFn: () => api.comercial.vendedores({ periodo }),
    initialData: []
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-lg shadow-xl border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {Number(entry.value || 0).toLocaleString('pt-BR')}
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
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard Comercial</h1>
            <p className="text-muted-foreground">Métricas de vendas e performance comercial</p>
          </div>
        </div>
      </motion.div>

      {/* KPIs Comerciais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Vendas do Mês', 
            value: kpis.vendas_mes || 0, 
            change: '+15%', 
            icon: ShoppingCart, 
            color: 'blue' 
          },
          { 
            label: 'Ticket Médio', 
            value: `R$ ${Number(kpis.ticket_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            change: '+12%', 
            icon: TrendingUp, 
            color: 'green' 
          },
          { 
            label: 'Taxa Conversão', 
            value: `${Number(kpis.taxa_conversao || 0).toFixed(1)}%`, 
            change: '+8%', 
            icon: Target, 
            color: 'orange' 
          },
          { 
            label: 'NPS', 
            value: kpis.nps || 85, 
            change: '+5pts', 
            icon: Award, 
            color: 'purple' 
          }
        ].map((kpi, index) => {
          const Icon = kpi.icon;
          const colorClasses = {
            blue: 'from-[#135670] to-[#1a7a9e]',
            green: 'from-emerald-500 to-emerald-600',
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
        {/* Evolução de Vendas */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#135670]" />
              Evolução de Vendas e Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={vendasMensais}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5c00" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff5c00" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="vendas" 
                    fill="url(#colorVendas)" 
                    stroke="#ff5c00" 
                    strokeWidth={3}
                    name="Nº de Vendas"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="ticket" 
                    stroke="#135670" 
                    strokeWidth={3}
                    dot={{ fill: '#135670', r: 5 }}
                    name="Ticket Médio (R$)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funil de Vendas */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#ff5c00]" />
              Pipeline de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="etapa" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="quantidade" fill="#135670" name="Quantidade" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="valor" fill="#ff5c00" name="Valor (R$)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance de Vendedores */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-[#135670]" />
              Performance por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="vendas" name="Vendas" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="ticket" name="Ticket" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Scatter name="Vendedores" data={vendedores} fill="#ff5c00">
                    {vendedores.map((entry, index) => (
                      <circle key={index} r={8} fill="#ff5c00" />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-[#ff5c00]" />
              Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProdutos}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#135670" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff5c00" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="codigo" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Código do Produto', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="receita" fill="url(#colorReceita)" name="Receita (R$)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
