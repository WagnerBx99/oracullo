import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
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
import * as XLSX from 'xlsx-js-style';
import api from '@/api/apiClient';

export default function GestaoPrecos() {
  const queryClient = useQueryClient();
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => api.produtos.list(),
    initialData: []
  });

  const { data: stats } = useQuery({
    queryKey: ['produtos-stats'],
    queryFn: () => api.produtos.stats(),
    initialData: {
      total_produtos: 0,
      custo_medio: 0,
      margem_media: 0
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {}, // Base44 removido
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] })
  });

  const handleUpdateProduto = async (id, data) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleExportar = () => {
    const dados = produtos.map(produto => {
      const margem = produto.margem || 0;
      return {
        'Código': produto.codigo,
        'Nome': produto.nome,
        'Categoria': produto.categoria || 'N/A',
        'Custo': produto.custo || 0,
        'Preço Venda': produto.preco_venda || 0,
        'Novo Preço': produto.novo_preco || produto.preco_venda || 0,
        'Margem (%)': margem,
        'Fonte': produto.fonte || 'N/A',
        'Status': produto.status || 'ativo'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    
    // Estilos
    const currencyFormat = 'R$ #,##0.00';
    const percentFormat = '0.00"%"';
    
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "135670" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    const defaultStyle = {
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E2E8F0" } },
        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } },
        right: { style: "thin", color: { rgb: "E2E8F0" } }
      }
    };
    
    const margemAltaStyle = {
      ...defaultStyle,
      fill: { fgColor: { rgb: "D1FAE5" } },
      font: { color: { rgb: "065F46" }, bold: true }
    };
    
    const margemMediaStyle = {
      ...defaultStyle,
      fill: { fgColor: { rgb: "FEF3C7" } },
      font: { color: { rgb: "92400E" } }
    };
    
    const margemBaixaStyle = {
      ...defaultStyle,
      fill: { fgColor: { rgb: "FEE2E2" } },
      font: { color: { rgb: "991B1B" } }
    };
    
    // Aplicar estilo ao header
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cell]) continue;
      ws[cell].s = headerStyle;
    }
    
    // Aplicar estilos às linhas de dados
    for (let row = 1; row <= range.e.r; row++) {
      const margemCell = XLSX.utils.encode_cell({ r: row, c: 6 }); // Coluna Margem (%)
      const margem = ws[margemCell] ? parseFloat(ws[margemCell].v) : 0;
      
      let margemStyle = defaultStyle;
      if (margem >= 30) {
        margemStyle = margemAltaStyle;
      } else if (margem >= 15) {
        margemStyle = margemMediaStyle;
      } else if (margem > 0) {
        margemStyle = margemBaixaStyle;
      }
      
      // Aplicar estilo à célula de margem
      if (ws[margemCell]) {
        ws[margemCell].s = margemStyle;
        ws[margemCell].z = percentFormat;
        ws[margemCell].t = 'n';
      }
      
      // Aplicar estilo padrão e formato às outras células
      for (let col = range.s.c; col <= range.e.c; col++) {
        if (col === 6) continue; // Pular coluna de margem
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cell]) {
          ws[cell].s = defaultStyle;
          // Aplicar formato de moeda às colunas 3, 4, 5 (Custo, Preço Venda, Novo Preço)
          if ((col === 3 || col === 4 || col === 5) && typeof ws[cell].v === 'number') {
            ws[cell].z = currencyFormat;
            ws[cell].t = 'n';
          }
        }
      }
    }
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 15 }, // Código
      { wch: 35 }, // Nome
      { wch: 15 }, // Categoria
      { wch: 12 }, // Custo
      { wch: 12 }, // Preço Venda
      { wch: 12 }, // Novo Preço
      { wch: 12 }, // Margem
      { wch: 12 }, // Fonte
      { wch: 10 }  // Status
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    
    XLSX.writeFile(wb, `Gestao_Precos_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        // Base44 removido - await update
        /*
        await update({
          preco_venda: produto.novo_preco,
          novo_preco: null
        });
        */
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
  console.log('=== GESTAO PRECOS DEBUG ===');
  console.log('stats raw:', stats);
  console.log('stats.total_produtos:', stats?.total_produtos, 'type:', typeof stats?.total_produtos);
  console.log('stats.custo_medio:', stats?.custo_medio, 'type:', typeof stats?.custo_medio);
  console.log('stats.margem_media:', stats?.margem_media, 'type:', typeof stats?.margem_media);
  
  const totalProdutos = parseInt(stats?.total_produtos) || 0;
  const custoMedio = parseFloat(stats?.custo_medio) || 0;
  const margemMedia = parseFloat(stats?.margem_media) || 0;
  const produtosComNovoPreco = produtos.filter(p => p.novo_preco).length;
  
  console.log('totalProdutos:', totalProdutos, 'type:', typeof totalProdutos);
  console.log('custoMedio:', custoMedio, 'type:', typeof custoMedio);
  console.log('margemMedia:', margemMedia, 'type:', typeof margemMedia);
  console.log('=========================');

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
          value={totalProdutos.toLocaleString('pt-BR')}
          subtitle="Consolidado ERP/CRM"
          icon={Package}
          color="blue"
          isLoading={isLoading}
        />
        <StatsCard
          title="Custo Médio"
          value={`R$ ${Number(custoMedio || 0).toFixed(2)}`}
          icon={DollarSign}
          color="green"
          isLoading={isLoading}
        />
        <StatsCard
          title="Margem Média"
          value={`${Number(margemMedia || 0).toFixed(1)}%`}
          icon={Percent}
          color="purple"
          trend={margemMedia > 0 ? 2.5 : 0}
          isLoading={isLoading}
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