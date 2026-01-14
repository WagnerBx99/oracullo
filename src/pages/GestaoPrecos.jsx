import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Filter } from 'lucide-react';
import { motion } from "framer-motion";
import StatsCard from '@/components/dashboard/StatsCard';
import CustoVendaTable from '@/components/dashboard/CustoVendaTable';
import { Package, DollarSign, TrendingUp, Percent } from 'lucide-react';

export default function GestaoPrecos() {
  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list('-created_date', 100),
    initialData: []
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Produto.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] })
  });

  const handleUpdateProduto = async (id, data) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleExportar = () => {
    // Lógica de exportação para Excel/CSV
    console.log('Exportando dados...');
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
          <h1 className="text-3xl font-bold gradient-text">Gestão de Preços</h1>
          <p className="text-muted-foreground mt-1">Análise de Custo x Venda consolidada dos sistemas integrados</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExportar}>
            <FileDown className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Produtos"
          value={totalProdutos}
          subtitle="Consolidado ERP/CRM"
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
          icon={Percent}
          color="purple"
          trend={2.5}
        />
        <StatsCard
          title="Novos Preços"
          value={produtosComNovoPreco}
          subtitle={`de ${totalProdutos} produtos`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Tabela Principal */}
      <CustoVendaTable 
        produtos={produtos} 
        onUpdateProduto={handleUpdateProduto}
      />
    </div>
  );
}