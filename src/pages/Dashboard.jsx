import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, DollarSign, TrendingUp, BarChart3, Plus, Upload, RefreshCw, Database, Target, Edit3, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";

import { motion } from "framer-motion";
import StatsCard from '@/components/dashboard/StatsCard';
import KPICard from '@/components/dashboard/KPICard';
import ConsolidacaoSistemas from '@/components/dashboard/ConsolidacaoSistemas';
import DatabaseArchitecture from '@/components/dashboard/DatabaseArchitecture';
import EditableDashboard from '@/components/dashboard/EditableDashboard';
import MargemChart from '@/components/dashboard/MargemChart';
import api from '@/api/apiClient';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [dashboardWidgets, setDashboardWidgets] = useState([]);

  // Buscar estatísticas gerais
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.stats(),
    refetchInterval: 60000 // Atualizar a cada 1 minuto
  });

  // Buscar KPIs do mês atual
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api.dashboard.kpis({}),
    refetchInterval: 60000
  });

  // Buscar vendas por filial
  const { data: vendasFilial, isLoading: vendasLoading } = useQuery({
    queryKey: ['dashboard-vendas-filial'],
    queryFn: () => api.dashboard.vendasPorFilial({}),
    refetchInterval: 60000
  });

  // Buscar integrações
  const { data: integracoes = [], isLoading: integracoesLoading } = useQuery({
    queryKey: ['integracoes'],
    queryFn: () => api.integracoes.list(),
    refetchInterval: 60000
  });

  // Buscar timeline de vendas (últimos 12 meses)
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['dashboard-timeline'],
    queryFn: () => api.dashboard.vendasTimeline({ meses: 12 }),
    refetchInterval: 300000 // Atualizar a cada 5 minutos
  });

  const isLoading = statsLoading || kpisLoading || vendasLoading || integracoesLoading;

  // DEBUG: Log dos dados recebidos
  console.log('=== DASHBOARD DEBUG ===');
  console.log('kpis raw data:', kpis);
  console.log('kpisLoading:', kpisLoading);
  console.log('stats:', stats);
  console.log('statsLoading:', statsLoading);

  // Calcular totais
  const totalClientes = stats?.total_clientes || 0;
  const totalClientesUnificados = stats?.total_clientes_unificados || 0;
  const receitaTotal = kpis?.receita_total || 0;
  const margemLiquida = kpis?.margem_liquida || 0;
  const variacaoReceita = kpis?.variacao_receita || 0;

  console.log('receitaTotal calculado:', receitaTotal);
  console.log('margemLiquida calculada:', margemLiquida);
  console.log('variacaoReceita calculada:', variacaoReceita);
  console.log('kpis?.ticket_medio:', kpis?.ticket_medio);
  console.log('kpis?.total_pedidos:', kpis?.total_pedidos);
  console.log('kpis?.total_clientes:', kpis?.total_clientes);
  console.log('======================');

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard Consolidado</h1>
          <p className="text-muted-foreground mt-1">Visão integrada de todos os sistemas - OMIE, WK, Mercos e Clic</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => queryClient.invalidateQueries()}
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar Dados
          </Button>
          <Button 
            className="gap-2 bg-gradient-to-r from-[#135670] to-[#ff5c00] text-white"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Edit3 className="w-4 h-4" />
            {isEditMode ? 'Salvar' : 'Personalizar'}
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Clientes"
          value={totalClientes.toLocaleString('pt-BR')}
          subtitle={`${totalClientesUnificados.toLocaleString('pt-BR')} únicos`}
          icon={Users}
          color="blue"
          isLoading={isLoading}
        />
        <StatsCard
          title="Receita Total"
          value={`R$ ${Number((receitaTotal / 1000) || 0).toFixed(1)}K`}
          subtitle={`${variacaoReceita > 0 ? '+' : ''}${variacaoReceita}% vs mês anterior`}
          icon={DollarSign}
          color="green"
          trend={variacaoReceita}
          isLoading={isLoading}
        />
        <StatsCard
          title="Margem Líquida"
          value={`${Number(margemLiquida || 0).toFixed(1)}%`}
          subtitle="Média consolidada"
          icon={TrendingUp}
          color="purple"
          isLoading={isLoading}
        />
        <StatsCard
          title="Integrações Ativas"
          value={stats?.integracoes_ativas || 0}
          subtitle={`de ${stats?.total_integracoes || 0} configuradas`}
          icon={Database}
          color="orange"
          isLoading={isLoading}
        />
      </div>

      {/* Arquitetura de Bancos de Dados */}
      <DatabaseArchitecture />

      {/* Consolidação de Sistemas */}
      <ConsolidacaoSistemas 
        integracoes={integracoes}
        onSincronizar={() => queryClient.invalidateQueries()}
      />

      {/* Dashboard Editável */}
      {isEditMode && (
        <div>
          <EditableDashboard
            widgets={dashboardWidgets}
            onSave={setDashboardWidgets}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
          />
        </div>
      )}

      {/* KPIs Principais */}
      {kpis && !isEditMode && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Indicadores Principais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard 
              kpi={{
                id: 1,
                nome: 'Receita Total',
                valor_atual: receitaTotal,
                unidade: 'reais',
                categoria: 'financeiro',
                fonte: 'Consolidado',
                valor_meta: receitaTotal * 1.1,
                periodo: new Date().toISOString()
              }}
              index={0}
            />
            <KPICard 
              kpi={{
                id: 2,
                nome: 'Lucro Líquido',
                valor_atual: kpis?.lucro_liquido || 0,
                unidade: 'reais',
                categoria: 'financeiro',
                fonte: 'Consolidado',
                valor_meta: (kpis?.lucro_liquido || 0) * 1.15,
                periodo: new Date().toISOString()
              }}
              index={1}
            />
            <KPICard 
              kpi={{
                id: 3,
                nome: 'Ticket Médio',
                valor_atual: kpis?.ticket_medio || 0,
                unidade: 'reais',
                categoria: 'comercial',
                fonte: 'Consolidado',
                valor_meta: (kpis?.ticket_medio || 0) * 1.05,
                periodo: new Date().toISOString()
              }}
              index={2}
            />
            <KPICard 
              kpi={{
                id: 4,
                nome: 'Total de Pedidos',
                valor_atual: kpis?.total_pedidos || 0,
                unidade: 'numero',
                categoria: 'comercial',
                fonte: 'Consolidado',
                valor_meta: (kpis?.total_pedidos || 0) * 1.2,
                periodo: new Date().toISOString()
              }}
              index={3}
            />
            <KPICard 
              kpi={{
                id: 5,
                nome: 'Clientes Ativos',
                valor_atual: stats?.total_clientes || 0,
                unidade: 'numero',
                categoria: 'comercial',
                fonte: 'Consolidado',
                valor_meta: (stats?.total_clientes || 0) * 1.1,
                periodo: new Date().toISOString()
              }}
              index={4}
            />
            <KPICard 
              kpi={{
                id: 6,
                nome: 'Margem Líquida',
                valor_atual: margemLiquida,
                unidade: 'percentual',
                categoria: 'margem',
                fonte: 'Consolidado',
                valor_meta: 35,
                periodo: new Date().toISOString()
              }}
              index={5}
            />
          </div>
        </div>
      )}



      {/* Empty State */}
      {!isLoading && (!stats || stats.total_clientes === 0) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-2xl shadow-lg p-12 text-center border"
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Aguardando sincronização de dados
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Configure as integrações com OMIE, WK, Mercos e Clic para começar a consolidar seus dados.
          </p>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" />
            Configurar Integrações
          </Button>
        </motion.div>
      )}
    </div>
  );
}
