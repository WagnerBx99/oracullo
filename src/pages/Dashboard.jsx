import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, DollarSign, TrendingUp, BarChart3, Plus, Upload, RefreshCw, Database, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import StatsCard from '@/components/dashboard/StatsCard';
import KPICard from '@/components/dashboard/KPICard';
import ConsolidacaoSistemas from '@/components/dashboard/ConsolidacaoSistemas';
import MargemChart from '@/components/dashboard/MargemChart';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("consolidado");

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list('-created_date', 100),
    initialData: []
  });

  const { data: integracoes = [] } = useQuery({
    queryKey: ['integracoes'],
    queryFn: () => base44.entities.Integracao.list(),
    initialData: []
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => base44.entities.KPI.list('-created_date', 20),
    initialData: []
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Produto.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] })
  });

  const handleUpdateProduto = async (id, data) => {
    await updateMutation.mutateAsync({ id, data });
  };

  // Calculate stats
  const totalProdutos = produtos.length;
  const custoMedio = produtos.length > 0 
    ? produtos.reduce((sum, p) => sum + (p.custo || 0), 0) / produtos.length 
    : 0;
  const margemMedia = produtos.length > 0
    ? produtos.reduce((sum, p) => {
        if (p.custo && p.preco_venda) {
          return sum + ((p.preco_venda - p.custo) / p.preco_venda * 100);
        }
        return sum;
      }, 0) / produtos.filter(p => p.custo && p.preco_venda).length || 0
    : 0;
  const produtosComNovoPreco = produtos.filter(p => p.novo_preco).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Consolidado</h1>
          <p className="text-slate-500 mt-1">Visão integrada de todos os sistemas - OMIE, WK, Mercos e Clic</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sincronizar Dados
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Produtos"
          value={totalProdutos}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Custo Médio"
          value={`R$ ${custoMedio.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Margem Média"
          value={`${margemMedia.toFixed(1)}%`}
          icon={TrendingUp}
          color="purple"
          trend={2.5}
        />
        <StatsCard
          title="Novos Preços"
          value={produtosComNovoPreco}
          subtitle={`de ${totalProdutos} produtos`}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Consolidação de Sistemas */}
      <ConsolidacaoSistemas 
        integracoes={integracoes}
        onSincronizar={() => queryClient.invalidateQueries()}
      />

      {/* KPIs Principais */}
      {kpis.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Indicadores Principais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.slice(0, 6).map((kpi, index) => (
              <KPICard key={kpi.id} kpi={kpi} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white shadow-sm border p-1">
          <TabsTrigger 
            value="consolidado" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Visão Consolidada
          </TabsTrigger>
          <TabsTrigger 
            value="graficos"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Análises Gráficas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consolidado" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MargemChart produtos={produtos} />
            <MargemChart produtos={[...produtos].reverse()} />
          </div>
        </TabsContent>

        <TabsContent value="graficos" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <MargemChart produtos={produtos} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {!isLoading && produtos.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Aguardando sincronização de dados
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
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