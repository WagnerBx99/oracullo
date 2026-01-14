import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Filter, Send, CheckCircle } from 'lucide-react';
import { motion } from "framer-motion";
import StatsCard from '@/components/dashboard/StatsCard';
import CustoVendaTable from '@/components/dashboard/CustoVendaTable';
import { Package, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function GestaoPrecos() {
  const queryClient = useQueryClient();
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

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

  const handleEnviarParaERP = async () => {
    setSyncInProgress(true);
    
    try {
      // Aqui você implementará a integração com o ERP
      // Por enquanto, vamos simular o envio
      const produtosComNovoPreco = produtos.filter(p => p.novo_preco);
      
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Após o envio bem-sucedido, atualizar preco_venda com novo_preco
      for (const produto of produtosComNovoPreco) {
        await base44.entities.Produto.update(produto.id, {
          preco_venda: produto.novo_preco,
          novo_preco: null // Limpar o novo_preco após aplicar
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      
      toast({
        title: "Preços sincronizados!",
        description: `${produtosComNovoPreco.length} produtos foram atualizados no ERP.`,
      });
      
      setShowSyncDialog(false);
    } catch (error) {
      toast({
        title: "Erro ao sincronizar",
        description: "Não foi possível enviar os preços para o ERP. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSyncInProgress(false);
    }
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
          
          <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
            <DialogTrigger asChild>
              <Button 
                className="gap-2 bg-gradient-to-r from-[#135670] to-[#ff5c00] hover:opacity-90"
                disabled={produtosComNovoPreco === 0}
              >
                <Send className="w-4 h-4" />
                Aplicar Novos Preços ({produtosComNovoPreco})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Novos Preços para o ERP</DialogTitle>
                <DialogDescription>
                  Você está prestes a aplicar {produtosComNovoPreco} novos preços e sincronizá-los com o ERP.
                  Esta ação atualizará os preços de venda dos produtos selecionados.
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Produtos a atualizar:</span>
                  <span className="font-bold text-foreground">{produtosComNovoPreco}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sistema de destino:</span>
                  <span className="font-medium text-foreground">OMIE / WK ERP</span>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEnviarParaERP}
                  disabled={syncInProgress}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {syncInProgress ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirmar e Enviar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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