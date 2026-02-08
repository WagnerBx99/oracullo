import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  Calendar,
  Building2,
  Users,
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx-js-style';
import api from '@/api/apiClient';

export default function Relatorios() {
  const [activeTab, setActiveTab] = useState("consolidado");
  const hoje = new Date();
  const [dataInicio, setDataInicio] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]);
  const [filialFiltro, setFilialFiltro] = useState("todas");

  // Buscar vendas consolidado
  const { data: vendasConsolidado, isLoading: loadingConsolidado, refetch: refetchConsolidado } = useQuery({
    queryKey: ['relatorios-vendas-consolidado', dataInicio, dataFim, filialFiltro],
    queryFn: () => api.relatorios.vendasConsolidado({
      data_inicio: dataInicio,
      data_fim: dataFim,
      ...(filialFiltro !== 'todas' && { filial_id: filialFiltro })
    })
  });

  // Buscar vendas trading
  const { data: vendasTrading, isLoading: loadingTrading } = useQuery({
    queryKey: ['relatorios-vendas-trading', dataInicio, dataFim],
    queryFn: () => api.relatorios.vendasTrading({
      data_inicio: dataInicio,
      data_fim: dataFim
    })
  });

  // Buscar resumo geral
  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ['relatorios-resumo', dataInicio, dataFim],
    queryFn: () => api.relatorios.resumoGeral({
      data_inicio: dataInicio,
      data_fim: dataFim
    })
  });

  // Buscar clientes por filial
  const { data: clientesFilial, isLoading: loadingClientes } = useQuery({
    queryKey: ['relatorios-clientes-filial'],
    queryFn: () => api.relatorios.clientesPorFilial()
  });

  // Buscar integrações para o filtro
  const { data: integracoes = [] } = useQuery({
    queryKey: ['integracoes'],
    queryFn: () => api.integracoes.list()
  });

  const isLoading = loadingConsolidado || loadingTrading || loadingResumo;

  const totalGeral = vendasConsolidado?.total_geral || 0;
  const totalTrading = vendasTrading?.total_trading || 0;
  const faturamentoTotal = totalGeral + totalTrading;

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const exportarParaExcel = () => {
    if (!vendasConsolidado) return;

    const dados = [];
    
    // Adicionar header
    dados.push(['Estado/Filial', 'Vendedor', 'Total Vendas', 'Total Pedidos', 'Ticket Médio']);
    
    // Adicionar dados consolidados
    vendasConsolidado.estados.forEach((estado) => {
      dados.push([estado.estado, '', '', '', '']);
      
      estado.filiais.forEach((filial) => {
        dados.push([
          filial.nome,
          '',
          filial.total_vendas,
          filial.total_pedidos,
          filial.ticket_medio
        ]);
        
        // Se houver vendedores, adicionar
        if (filial.vendedores && filial.vendedores.length > 0) {
          filial.vendedores.forEach((vendedor) => {
            dados.push([
              '',
              vendedor.nome,
              vendedor.total || 0,
              vendedor.pedidos || 0,
              0
            ]);
          });
        }
      });
      
      dados.push([
        `Total ${estado.estado}`,
        '',
        estado.total_estado,
        '',
        ''
      ]);
    });
    
    // Total Filiais
    dados.push(['Total Consolidado Filiais', '', totalGeral, '', '']);
    
    // Trading
    if (vendasTrading && vendasTrading.distribuidores && vendasTrading.distribuidores.length > 0) {
      dados.push(['', '', '', '', '']);
      dados.push(['VENDAS DIRETAS TRADING (DISTRIBUIÇÃO)', '', '', '', '']);
      
      vendasTrading.distribuidores.forEach((item) => {
        dados.push([item.distribuidor, '', item.total_vendas, item.total_pedidos, '']);
      });
      
      dados.push(['RESULTADO TRADING (DISTRIBUIÇÃO)', '', totalTrading, '', '']);
    }
    
    // Faturamento Total
    dados.push(['Faturamento Total do Período:', '', faturamentoTotal, '', '']);
    
    // Criar workbook e worksheet
    const ws = XLSX.utils.aoa_to_sheet(dados);
    
    // Aplicar estilos
    const currencyFormat = 'R$ #,##0.00';
    
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
    
    // Aplicar estilo ao header (linha 1)
    for (let col = 0; col < 5; col++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cell]) ws[cell] = { t: 's', v: '' };
      ws[cell].s = headerStyle;
    }
    
    // Aplicar formato de moeda às colunas de valores (2, 3, 4)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 2; col <= 4; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cell] && typeof ws[cell].v === 'number') {
          if (!ws[cell].s) ws[cell].s = {};
          ws[cell].z = currencyFormat;
          ws[cell].t = 'n';
        }
      }
    }
    
    // Definir largura das colunas
    ws['!cols'] = [
      { wch: 30 }, // Estado/Filial
      { wch: 25 }, // Vendedor
      { wch: 15 }, // Total Vendas
      { wch: 15 }, // Total Pedidos
      { wch: 15 }  // Ticket Médio
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório Vendas');
    
    // Gerar nome do arquivo com data
    const nomeArquivo = `relatorio_vendas_${dataInicio}_a_${dataFim}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análises detalhadas de vendas e performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              refetchConsolidado();
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button 
            className="gap-2 bg-gradient-to-r from-[#135670] to-[#ff5c00] text-white"
            onClick={exportarParaExcel}
            disabled={isLoading || !vendasConsolidado}
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>
      </motion.div>

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input 
                type="date" 
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input 
                type="date" 
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Filial</label>
              <Select value={filialFiltro} onValueChange={setFilialFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma filial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Filiais</SelectItem>
                  {integracoes.map((integracao) => (
                    <SelectItem key={integracao.id} value={String(integracao.id)}>
                      {integracao.nome} - {integracao.filial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendas</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{formatarValor(totalGeral)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trading</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{formatarValor(totalTrading)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pedidos</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{resumo?.resumo.total_pedidos || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{resumo?.resumo.total_clientes || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card shadow-sm border p-1">
          <TabsTrigger 
            value="consolidado" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Vendas Consolidado
          </TabsTrigger>
          <TabsTrigger 
            value="trading"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Trading
          </TabsTrigger>
          <TabsTrigger 
            value="clientes"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* Tab Consolidado */}
        <TabsContent value="consolidado" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Vendas por Estado e Filial
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  {vendasConsolidado?.periodo.inicio} a {vendasConsolidado?.periodo.fim}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : vendasConsolidado && vendasConsolidado.estados && vendasConsolidado.estados.length > 0 ? (
                <div className="space-y-6">
                  {vendasConsolidado.estados.map((estado, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      {/* Header do Estado */}
                      <div className="bg-slate-700 text-white p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold">{estado.estado}</h3>
                          <span className="text-xl font-bold">{formatarValor(estado.total_estado)}</span>
                        </div>
                      </div>
                      
                      {/* Filiais do Estado */}
                      <div className="divide-y">
                        {estado.filiais.map((filial, fIdx) => (
                          <div key={fIdx} className="p-4 bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-foreground">{filial.nome}</p>
                                <p className="text-sm text-muted-foreground">{filial.filial}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">{formatarValor(filial.total_vendas)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {filial.total_pedidos} pedidos • Ticket: {formatarValor(filial.ticket_medio)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Vendedores (se houver) */}
                            {filial.vendedores && filial.vendedores.length > 0 && (
                              <div className="mt-3 pl-4 space-y-1">
                                {filial.vendedores.map((vendedor, vIdx) => (
                                  <div key={vIdx} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{vendedor.nome}</span>
                                    <span className="font-medium">{formatarValor(vendedor.total || 0)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Total Geral */}
                  <div className="bg-green-600 text-white p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Total Consolidado Filiais</h3>
                      <span className="text-3xl font-bold">{formatarValor(totalGeral)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma venda encontrada no período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Trading */}
        <TabsContent value="trading" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Vendas Trading / Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : vendasTrading && vendasTrading.distribuidores && vendasTrading.distribuidores.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Distribuidor</TableHead>
                        <TableHead className="text-right">Total Vendas</TableHead>
                        <TableHead className="text-right">Pedidos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendasTrading.distribuidores.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.distribuidor}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatarValor(item.total_vendas)}
                          </TableCell>
                          <TableCell className="text-right">{item.total_pedidos}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="bg-orange-600 text-white p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Total Trading</h3>
                      <span className="text-3xl font-bold">{formatarValor(totalTrading)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma venda de trading encontrada no período</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Clientes */}
        <TabsContent value="clientes" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Distribuição de Clientes por Filial
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingClientes ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : clientesFilial && clientesFilial.filiais && clientesFilial.filiais.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filial</TableHead>
                        <TableHead className="text-right">Total Clientes</TableHead>
                        <TableHead className="text-right">Clientes Ativos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientesFilial.filiais.map((filial, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {filial.nome}
                            <span className="text-sm text-muted-foreground ml-2">({filial.filial})</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {filial.total_clientes.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {filial.clientes_ativos.toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="bg-blue-600 text-white p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Total Geral de Clientes</h3>
                      <span className="text-3xl font-bold">
                        {clientesFilial.total_geral.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Faturamento Total */}
      {!isLoading && faturamentoTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-slate-300 mb-1">Faturamento Total do Período</p>
              <p className="text-sm text-slate-400">
                {dataInicio} a {dataFim}
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">{formatarValor(faturamentoTotal)}</p>
              <p className="text-sm text-slate-300 mt-2">
                Filiais: {formatarValor(totalGeral)} + Trading: {formatarValor(totalTrading)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
