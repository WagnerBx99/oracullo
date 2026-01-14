import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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
  Filter
} from 'lucide-react';
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx-js-style';

// Dados mock para demonstração
const dadosConsolidado = [
  {
    estado: 'Santa Catarina',
    filiais: [
      {
        nome: 'Blumenau',
        vendedores: [
          { nome: 'Edson Melo', dia: 18545.54, total: 18545.54, diario: 0, parcialMes: 0 },
          { nome: 'João Otavio', dia: 23066.55, total: 23066.55, diario: 0, parcialMes: 0 },
          { nome: 'Kailany Cristina', dia: 0, total: 0, diario: 0, parcialMes: 0 }
        ],
        total: 63537.00
      },
      {
        nome: 'Chapecó',
        vendedores: [
          { nome: 'Cristiane', dia: 0, total: 0, diario: 0, parcialMes: 0 },
          { nome: 'Farinhas', dia: 2432.81, total: 2432.81, diario: 0, parcialMes: 0 },
          { nome: 'Isaac Quadros', dia: 3561.22, total: 3561.22, diario: 0, parcialMes: 0 },
          { nome: 'Chapecó', dia: 7122.53, total: 7122.53, diario: 0, parcialMes: 0 }
        ],
        total: 7122.53
      },
      {
        nome: 'Joinville',
        vendedores: [
          { nome: 'Farinhas', dia: 12218.09, total: 12218.09, diario: 0, parcialMes: 0 }
        ],
        total: 12218.09
      }
    ],
    totalEstado: 48958.02
  },
  {
    estado: 'Paraná',
    filiais: [
      {
        nome: 'Curitiba',
        vendedores: [
          { nome: 'Marcos Candido', dia: 3480.29, total: 3480.29, diario: 0, parcialMes: 0 },
          { nome: 'Anderson Clososki', dia: 232.11, total: 232.11, diario: 0, parcialMes: 0 }
        ],
        total: 16017.65
      },
      {
        nome: 'Maringá',
        vendedores: [
          { nome: 'Caio Vitor', dia: 4168.89, total: 4168.89, diario: 0, parcialMes: 0 },
          { nome: 'Marcia Maria', dia: 0, total: 0, diario: 0, parcialMes: 0 }
        ],
        total: 21924.81
      }
    ],
    totalEstado: 63537.00
  },
  {
    estado: 'Belo Horizonte',
    filiais: [
      {
        nome: 'Belo Horizonte',
        vendedores: [
          { nome: 'Rogério', dia: 1389.94, total: 1389.94, diario: 0, parcialMes: 0 },
          { nome: 'Hugo', dia: 1778.16, total: 1778.16, diario: 0, parcialMes: 0 },
          { nome: 'Thiago', dia: 4182.14, total: 4182.14, diario: 0, parcialMes: 0 }
        ],
        total: 14727.59
      }
    ],
    totalEstado: 14727.59
  },
  {
    estado: 'São Paulo',
    filiais: [
      {
        nome: 'Sorocaba',
        vendedores: [
          { nome: 'Ana Galão', dia: 5619.40, total: 5619.40, diario: 0, parcialMes: 0 },
          { nome: 'Cyro Galão', dia: 0, total: 0, diario: 0, parcialMes: 0 }
        ],
        total: 5619.40
      },
      {
        nome: 'São Paulo Capital',
        vendedores: [
          { nome: 'Sara', dia: 3675.10, total: 3675.10, diario: 0, parcialMes: 0 },
          { nome: 'Erik', dia: 1766.21, total: 1766.21, diario: 0, parcialMes: 0 }
        ],
        total: 5441.31
      }
    ],
    totalEstado: 11060.71
  },
  {
    estado: 'Brasília',
    filiais: [
      {
        nome: 'Distrito Federal',
        vendedores: [
          { nome: 'Mario Marden', dia: 11912.73, total: 11912.73, diario: 0, parcialMes: 0 }
        ],
        total: 11912.73
      }
    ],
    totalEstado: 11912.73
  }
];

const dadosTrading = [
  { distribuidor: 'Via Lote', dia: 0, total: 0 },
  { distribuidor: 'Golbrond', dia: 0, total: 0 },
  { distribuidor: 'Avon', dia: 0, total: 0 },
  { distribuidor: 'Sants', dia: 0, total: 0 },
  { distribuidor: 'Cadu Varejo Atacadista', dia: 9620.00, total: 9620.00 }
];

export default function Relatorios() {
  const [activeTab, setActiveTab] = useState("consolidado");
  const [dataInicio, setDataInicio] = useState("2026-01-01");
  const [dataFim, setDataFim] = useState("2026-01-31");
  const [filialFiltro, setFilialFiltro] = useState("todas");

  const totalGeral = dadosConsolidado.reduce((sum, estado) => sum + estado.totalEstado, 0);
  const totalTrading = dadosTrading.reduce((sum, item) => sum + item.total, 0);
  const faturamentoTotal = totalGeral + totalTrading;

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const exportarParaExcel = () => {
    const dados = [];
    
    // Adicionar header
    dados.push(['Filial', 'Vendedor', '05/Jan', 'Total', 'Diário', 'Parcial Mês']);
    
    // Adicionar dados consolidados
    dadosConsolidado.forEach((estado) => {
      dados.push([estado.estado, '', '', '', '', '']);
      
      estado.filiais.forEach((filial) => {
        filial.vendedores.forEach((vendedor, idx) => {
          dados.push([
            idx === 0 ? filial.nome : '',
            vendedor.nome,
            vendedor.dia,
            vendedor.total,
            vendedor.diario,
            vendedor.parcialMes
          ]);
        });
        
        dados.push([
          `Total ${filial.nome}`,
          '',
          filial.total,
          filial.total,
          0,
          0
        ]);
      });
      
      dados.push([
        `Total Consolidado ${estado.estado}`,
        '',
        estado.totalEstado,
        estado.totalEstado,
        0,
        0
      ]);
    });
    
    // Total Filiais
    dados.push(['Total Consolidado Filiais', '', totalGeral, totalGeral, 0, 0]);
    
    // Trading
    dados.push(['', '', '', '', '', '']);
    dados.push(['VENDAS DIRETAS TRADING (DISTRIBUIÇÃO)', '', '', '', '', '']);
    
    dadosTrading.forEach((item) => {
      dados.push([item.distribuidor, '', item.dia, item.total, 0, 0]);
    });
    
    dados.push(['RESULTADO TRADING (DISTRIBUIÇÃO)', '', totalTrading, totalTrading, 0, 0]);
    
    // Faturamento Total
    dados.push(['Faturamento do dia:', '', faturamentoTotal, faturamentoTotal, 0, 0]);
    
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
    
    const estadoStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "475569" } },
      alignment: { vertical: "center" }
    };
    
    const totalFilialStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
      fill: { fgColor: { rgb: "1a5872" } },
      alignment: { vertical: "center" }
    };
    
    const totalEstadoStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "0f4254" } },
      alignment: { vertical: "center" }
    };
    
    const totalGeralStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "10b981" } },
      alignment: { vertical: "center" }
    };
    
    const tradingHeaderStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "991b1b" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    const tradingTotalStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "ff5c00" } },
      alignment: { vertical: "center" }
    };
    
    const faturamentoStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
      fill: { fgColor: { rgb: "1e293b" } },
      alignment: { vertical: "center" }
    };
    
    // Aplicar estilo ao header (linha 1)
    for (let col = 0; col < 6; col++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cell]) ws[cell] = { t: 's', v: '' };
      ws[cell].s = headerStyle;
    }
    
    // Aplicar formato de moeda às colunas de valores (2, 3, 4, 5)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 2; col <= 5; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cell] && typeof ws[cell].v === 'number') {
          if (!ws[cell].s) ws[cell].s = {};
          ws[cell].z = currencyFormat;
          ws[cell].t = 'n';
        }
      }
    }
    
    // Aplicar estilos às linhas com base no conteúdo
    let rowIndex = 1;
    dadosConsolidado.forEach((estado) => {
      // Linha do estado
      for (let col = 0; col < 6; col++) {
        const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
        if (!ws[cell]) ws[cell] = { t: 's', v: '' };
        ws[cell].s = estadoStyle;
      }
      rowIndex++;
      
      estado.filiais.forEach((filial) => {
        rowIndex += filial.vendedores.length;
        
        // Linha total da filial
        for (let col = 0; col < 6; col++) {
          const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
          if (!ws[cell]) ws[cell] = { t: 's', v: '' };
          ws[cell].s = totalFilialStyle;
        }
        rowIndex++;
      });
      
      // Linha total do estado
      for (let col = 0; col < 6; col++) {
        const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
        if (!ws[cell]) ws[cell] = { t: 's', v: '' };
        ws[cell].s = totalEstadoStyle;
      }
      rowIndex++;
    });
    
    // Total Filiais
    for (let col = 0; col < 6; col++) {
      const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
      if (!ws[cell]) ws[cell] = { t: 's', v: '' };
      ws[cell].s = totalGeralStyle;
    }
    rowIndex++;
    
    // Linha vazia
    rowIndex++;
    
    // Header Trading
    for (let col = 0; col < 6; col++) {
      const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
      if (!ws[cell]) ws[cell] = { t: 's', v: '' };
      ws[cell].s = tradingHeaderStyle;
    }
    rowIndex++;
    
    // Linhas de trading
    rowIndex += dadosTrading.length;
    
    // Total Trading
    for (let col = 0; col < 6; col++) {
      const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
      if (!ws[cell]) ws[cell] = { t: 's', v: '' };
      ws[cell].s = tradingTotalStyle;
    }
    rowIndex++;
    
    // Faturamento Total
    for (let col = 0; col < 6; col++) {
      const cell = XLSX.utils.encode_cell({ r: rowIndex, c: col });
      if (!ws[cell]) ws[cell] = { t: 's', v: '' };
      ws[cell].s = faturamentoStyle;
    }
    
    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Vendas');
    
    // Download
    XLSX.writeFile(wb, `Relatorio_Vendas_${dataInicio}_${dataFim}.xlsx`);
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
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Relatórios de Vendas</h1>
            <p className="text-muted-foreground">Acompanhamento diário e consolidado por filial</p>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <Card className="border-0 shadow-lg bg-card">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-foreground mb-2 block">Data Início</label>
              <Input 
                type="date" 
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-foreground mb-2 block">Data Fim</label>
              <Input 
                type="date" 
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-foreground mb-2 block">Filial</label>
              <Select value={filialFiltro} onValueChange={setFilialFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Filiais</SelectItem>
                  <SelectItem value="blumenau">Blumenau</SelectItem>
                  <SelectItem value="curitiba">Curitiba</SelectItem>
                  <SelectItem value="sp">São Paulo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-2 bg-[#135670] hover:bg-[#135670]/90">
              <Filter className="w-4 h-4" />
              Filtrar
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportarParaExcel}>
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-3xl font-bold text-foreground mt-1">{formatarValor(faturamentoTotal)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Filiais</p>
                <p className="text-3xl font-bold text-foreground mt-1">{formatarValor(totalGeral)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#135670] to-[#1a7a9e] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trading</p>
                <p className="text-3xl font-bold text-foreground mt-1">{formatarValor(totalTrading)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff5c00] to-orange-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card shadow-sm border">
          <TabsTrigger value="consolidado" className="data-[state=active]:bg-[#135670] data-[state=active]:text-white">
            Consolidado por Filial
          </TabsTrigger>
          <TabsTrigger value="detalhado" className="data-[state=active]:bg-[#135670] data-[state=active]:text-white">
            Detalhado por Vendedor
          </TabsTrigger>
        </TabsList>

        {/* Relatório Consolidado */}
        <TabsContent value="consolidado" className="mt-6">
          <Card className="border-0 shadow-lg bg-card">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#135670]" />
                Faturamento Consolidado por Filial
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#135670] hover:bg-[#135670]">
                      <TableHead className="text-white font-bold">Filial</TableHead>
                      <TableHead className="text-white font-bold text-right">05/Jan</TableHead>
                      <TableHead className="text-white font-bold text-right">Total</TableHead>
                      <TableHead className="text-white font-bold text-center">Diário</TableHead>
                      <TableHead className="text-white font-bold text-center">Parcial Mês</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosConsolidado.map((estado, idx) => (
                      <React.Fragment key={idx}>
                        {/* Estado Header */}
                        <TableRow className="bg-slate-700 hover:bg-slate-700">
                          <TableCell colSpan={5} className="font-bold text-white py-2">
                            {estado.estado}
                          </TableCell>
                        </TableRow>
                        
                        {/* Filiais */}
                        {estado.filiais.map((filial, fidx) => (
                          <React.Fragment key={fidx}>
                            {filial.vendedores.map((vendedor, vidx) => (
                              <TableRow key={vidx} className="hover:bg-muted/50">
                                <TableCell className="pl-8 text-foreground">
                                  {vidx === 0 && <strong>{filial.nome}</strong>}
                                  {vidx > 0 && <span className="ml-4">{vendedor.nome}</span>}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatarValor(vendedor.dia)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-foreground">
                                  {formatarValor(vendedor.total)}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                  {formatarValor(vendedor.diario)}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                  {formatarValor(vendedor.parcialMes)}
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {/* Total Filial */}
                            <TableRow className="bg-[#1a5872] hover:bg-[#1a5872]">
                              <TableCell className="font-bold text-white">
                                Total {filial.nome}
                              </TableCell>
                              <TableCell className="text-right font-bold text-white">
                                {formatarValor(filial.total)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-white">
                                {formatarValor(filial.total)}
                              </TableCell>
                              <TableCell className="text-center font-bold text-white">
                                R$ 0,00
                              </TableCell>
                              <TableCell className="text-center font-bold text-white">
                                R$ 0,00
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}

                        {/* Total Estado */}
                        <TableRow className="bg-[#0f4254] hover:bg-[#0f4254]">
                          <TableCell className="font-bold text-white text-lg">
                            Total Consolidado {estado.estado}
                          </TableCell>
                          <TableCell className="text-right font-bold text-white text-lg">
                            {formatarValor(estado.totalEstado)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-white text-lg">
                            {formatarValor(estado.totalEstado)}
                          </TableCell>
                          <TableCell className="text-center font-bold text-white">
                            R$ 0,00
                          </TableCell>
                          <TableCell className="text-center font-bold text-white">
                            R$ 0,00
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}

                    {/* Total Filiais */}
                    <TableRow className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-700">
                      <TableCell className="font-bold text-white text-xl">
                        Total Consolidado Filiais
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-xl">
                        {formatarValor(totalGeral)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-xl">
                        {formatarValor(totalGeral)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-white">
                        R$ 0,00
                      </TableCell>
                      <TableCell className="text-center font-bold text-white">
                        R$ 0,00
                      </TableCell>
                    </TableRow>

                    {/* Trading */}
                    <TableRow className="bg-red-800 hover:bg-red-800">
                      <TableCell colSpan={5} className="font-bold text-white text-center py-3">
                        VENDAS DIRETAS TRADING (DISTRIBUIÇÃO)
                      </TableCell>
                    </TableRow>

                    {dadosTrading.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell className="pl-8 text-foreground">{item.distribuidor}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatarValor(item.dia)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatarValor(item.total)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">R$ 0,00</TableCell>
                        <TableCell className="text-center text-muted-foreground">R$ 0,00</TableCell>
                      </TableRow>
                    ))}

                    {/* Total Trading */}
                    <TableRow className="bg-[#ff5c00] hover:bg-[#ff5c00]">
                      <TableCell className="font-bold text-white text-xl">
                        RESULTADO TRADING (DISTRIBUIÇÃO)
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-xl">
                        {formatarValor(totalTrading)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-xl">
                        {formatarValor(totalTrading)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-white">
                        R$ 0,00
                      </TableCell>
                      <TableCell className="text-center font-bold text-white">
                        R$ 0,00
                      </TableCell>
                    </TableRow>

                    {/* Faturamento Total */}
                    <TableRow className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-900">
                      <TableCell className="font-bold text-white text-2xl py-4">
                        Faturamento do dia:
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-2xl">
                        {formatarValor(faturamentoTotal)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-2xl">
                        {formatarValor(faturamentoTotal)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-white">
                        R$ 0,00
                      </TableCell>
                      <TableCell className="text-center font-bold text-white">
                        R$ 0,00
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório Detalhado */}
        <TabsContent value="detalhado" className="mt-6">
          <Card className="border-0 shadow-lg bg-card">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ff5c00]" />
                Acompanhamento Diário - Detalhado por Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#135670] hover:bg-[#135670]">
                      <TableHead className="text-white font-bold">Filial</TableHead>
                      <TableHead className="text-white font-bold">Vendedor</TableHead>
                      <TableHead className="text-white font-bold text-right">05/Jan</TableHead>
                      <TableHead className="text-white font-bold text-right">Total</TableHead>
                      <TableHead className="text-white font-bold text-center" colSpan={2}>
                        ATÉ6000 PRO
                      </TableHead>
                    </TableRow>
                    <TableRow className="bg-[#1a5872] hover:bg-[#1a5872]">
                      <TableHead className="text-white"></TableHead>
                      <TableHead className="text-white"></TableHead>
                      <TableHead className="text-white"></TableHead>
                      <TableHead className="text-white"></TableHead>
                      <TableHead className="text-white text-center">Diário</TableHead>
                      <TableHead className="text-white text-center">Parcial Mês</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosConsolidado.map((estado, idx) => (
                      <React.Fragment key={idx}>
                        {estado.filiais.map((filial, fidx) => (
                          <React.Fragment key={fidx}>
                            {filial.vendedores.map((vendedor, vidx) => (
                              <TableRow key={vidx} className="hover:bg-muted/50">
                                <TableCell className="font-medium text-foreground">
                                  {vidx === 0 ? filial.nome : ''}
                                </TableCell>
                                <TableCell className="italic text-muted-foreground">
                                  {vendedor.nome}
                                </TableCell>
                                <TableCell className="text-right text-foreground">
                                  {formatarValor(vendedor.dia)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-foreground">
                                  {formatarValor(vendedor.total)}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                  {formatarValor(vendedor.diario)}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">
                                  {formatarValor(vendedor.parcialMes)}
                                </TableCell>
                              </TableRow>
                            ))}
                            
                            {/* Subtotal Filial */}
                            <TableRow className="bg-[#1a5872] hover:bg-[#1a5872]">
                              <TableCell colSpan={2} className="font-bold text-white">
                                Total: {filial.nome}
                              </TableCell>
                              <TableCell className="text-right font-bold text-white">
                                {formatarValor(filial.total)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-white">
                                {formatarValor(filial.total)}
                              </TableCell>
                              <TableCell className="text-center font-bold text-white">
                                R$ 0,00
                              </TableCell>
                              <TableCell className="text-center font-bold text-white">
                                R$ 0,00
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}

                        {/* Total Estado */}
                        <TableRow className="bg-[#0f4254] hover:bg-[#0f4254]">
                          <TableCell colSpan={2} className="font-bold text-white text-lg">
                            Total Consolidado {estado.estado}:
                          </TableCell>
                          <TableCell className="text-right font-bold text-white text-lg">
                            {formatarValor(estado.totalEstado)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-white text-lg">
                            {formatarValor(estado.totalEstado)}
                          </TableCell>
                          <TableCell className="text-center font-bold text-white">
                            R$ 0,00
                          </TableCell>
                          <TableCell className="text-center font-bold text-white">
                            R$ 0,00
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}

                    {/* Total Consolidado Final */}
                    <TableRow className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-700">
                      <TableCell colSpan={2} className="font-bold text-white text-xl">
                        Total Consolidado Filias
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-xl">
                        {formatarValor(totalGeral)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-xl">
                        {formatarValor(totalGeral)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-white">
                        R$ 0,00
                      </TableCell>
                      <TableCell className="text-center font-bold text-white">
                        R$ 0,00
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}