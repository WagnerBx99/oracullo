import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Table, TableBody, TableCell, TableHead, TableRow
} from 'recharts';
import { DollarSign, TrendingUp, Users, Target, Download, Filter } from 'lucide-react';
import { api } from '../api/apiClient';

const colors = ['#135670', '#ff5c00', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function FechamentoComissoes() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  // Buscar dados de comissões
  const { data: comissoesData = {}, isLoading } = useQuery({
    queryKey: ['diretoria-comissoes', mes, ano],
    queryFn: () => api.diretoria.comissoes({ mes, ano }),
    refetchInterval: 300000,
  });

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0';
    if (value >= 1000000) {
      return `R$ ${Number((value / 1000000) || 0).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${Number((value / 1000) || 0).toFixed(0)}K`;
    }
    return `R$ ${Number(value || 0).toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (!value && value !== 0) return '0%';
    return `${Number(value || 0).toFixed(1)}%`;
  };

  // Cards de resumo
  const resumo = comissoesData.resumo || {};
  const cards = [
    {
      label: 'Total de Vendedores',
      value: resumo.total_vendedores || 0,
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Total de Vendas',
      value: formatCurrency(resumo.total_vendas_geral || 0),
      icon: DollarSign,
      color: 'emerald'
    },
    {
      label: 'Total de Comissões',
      value: formatCurrency(resumo.total_comissoes_geral || 0),
      icon: TrendingUp,
      color: 'orange'
    },
    {
      label: 'Meta Atingida',
      value: formatPercent(resumo.percentual_meta_medio || 0),
      icon: Target,
      color: 'purple'
    }
  ];

  // Preparar dados para gráficos
  const distribuicaoData = (comissoesData.distribuicao_vendedor || []).map(item => ({
    name: item.tipo_vendedor,
    vendedores: item.qtd_vendedores,
    vendas: Number(item.total_vendas || 0),
    comissoes: Number(item.total_comissao || 0)
  }));

  const detalhesData = (comissoesData.detalhes || [])
    .filter(item => filtroTipo === 'TODOS' || item.tipo_vendedor === filtroTipo)
    .slice(0, 20);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-lg shadow-xl border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString('pt-BR')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#135670] to-[#ff5c00] flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Fechamento de Comissões</h1>
              <p className="text-muted-foreground">Análise consolidada de vendas e comissões</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 items-center bg-card p-4 rounded-lg border border-border"
      >
        <Filter className="w-5 h-5 text-muted-foreground" />
        <select 
          value={mes} 
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
        >
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2026, i).toLocaleString('pt-BR', { month: 'long' })}
            </option>
          ))}
        </select>
        <select 
          value={ano} 
          onChange={(e) => setAno(parseInt(e.target.value))}
          className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select 
          value={filtroTipo} 
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
        >
          <option value="TODOS">Todos os Vendedores</option>
          <option value="INTERNO">Vendedores Internos</option>
          <option value="EXTERNO">Consultores Externos</option>
        </select>
      </motion.div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
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
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[card.color]} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Tipo de Vendedor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Distribuição por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribuicaoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="vendedores" fill="#135670" name="Vendedores" />
              <Bar dataKey="comissoes" fill="#ff5c00" name="Comissões (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Comparativo Vendas vs Comissões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Vendas vs Comissões</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={distribuicaoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="#135670" name="Vendas" strokeWidth={2} />
              <Line type="monotone" dataKey="comissoes" stroke="#ff5c00" name="Comissões" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Tabela de Detalhes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 overflow-x-auto"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Detalhes por Vendedor</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Vendedor</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Marca</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Filial</th>
              <th className="text-right py-3 px-4 font-semibold text-foreground">Vendas</th>
              <th className="text-right py-3 px-4 font-semibold text-foreground">Comissão</th>
              <th className="text-right py-3 px-4 font-semibold text-foreground">Meta %</th>
            </tr>
          </thead>
          <tbody>
            {detalhesData.map((item, index) => (
              <tr key={index} className="border-b border-border hover:bg-background/50 transition-colors">
                <td className="py-3 px-4 text-foreground">{item.vendedor}</td>
                <td className="py-3 px-4 text-foreground">{item.marca}</td>
                <td className="py-3 px-4 text-foreground">{item.filial}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatCurrency(item.total_vendas)}</td>
                <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(item.total_comissao)}</td>
                <td className="py-3 px-4 text-right text-foreground">{formatPercent(item.percentual_meta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
