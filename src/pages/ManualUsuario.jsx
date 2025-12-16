import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageUrl } from '../utils';
import { 
  FileText, Download, ChevronRight, Home, LayoutDashboard, 
  Database, ShoppingCart, Settings, DollarSign, BarChart3,
  TrendingUp, Package, Target, Users, Award, Briefcase,
  Layers, FileDown, Filter, RefreshCw, Edit3, Plus, Upload,
  Eye, Zap, PieChart, Activity, ExternalLink
} from 'lucide-react';

export default function ManualUsuario() {
  const [secaoAtiva, setSecaoAtiva] = useState('introducao');

  const secoes = [
    { id: 'introducao', titulo: 'Introdução', icon: Home },
    { id: 'dashboard', titulo: 'Dashboard Consolidado', icon: LayoutDashboard },
    { id: 'diretoria', titulo: 'Visão Diretoria', icon: Briefcase },
    { id: 'comercial', titulo: 'Dashboard Comercial', icon: ShoppingCart },
    { id: 'operacional', titulo: 'Dashboard Operacional', icon: Activity },
    { id: 'gestaoprecos', titulo: 'Gestão de Preços', icon: DollarSign },
    { id: 'integracoes', titulo: 'Integrações', icon: Database },
    { id: 'relatorios', titulo: 'Relatórios', icon: FileText },
    { id: 'administracao', titulo: 'Administração', icon: Settings }
  ];

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header do Manual */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg border-b sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#135670] to-[#ff5c00] flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Manual do Usuário</h1>
              <p className="text-sm text-muted-foreground">ORACULLO - Sistema de Gestão PEC Motors</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => window.open(createPageUrl('ManualStandalone'), '_blank')} 
              variant="outline"
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Versão Externa
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2 bg-gradient-to-r from-[#135670] to-[#ff5c00]">
              <Download className="w-4 h-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Índice Lateral */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 flex-shrink-0 sticky top-24 self-start hidden lg:block"
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-sm">Índice</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {secoes.map((secao) => {
                  const Icon = secao.icon;
                  return (
                    <button
                      key={secao.id}
                      onClick={() => setSecaoAtiva(secao.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                        ${secaoAtiva === secao.id 
                          ? 'bg-gradient-to-r from-[#135670] to-[#ff5c00] text-white shadow-lg' 
                          : 'text-slate-600 hover:bg-slate-100'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {secao.titulo}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conteúdo do Manual */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 space-y-8"
        >
          {/* Introdução */}
          {secaoAtiva === 'introducao' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <Home className="w-6 h-6 text-[#135670]" />
                  <CardTitle>1. Introdução ao Sistema ORACULLO</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">Sobre o ORACULLO</h3>
                  <p className="text-slate-600 leading-relaxed">
                    O <strong>ORACULLO</strong> é uma plataforma integrada de gestão desenvolvida especialmente para a PEC Motors. 
                    O sistema consolida dados de múltiplos sistemas (OMIE, WK, Mercos e Clic) em uma única interface, 
                    proporcionando visibilidade completa sobre operações comerciais, financeiras e operacionais.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-[#135670] p-6 rounded-r-lg">
                  <h4 className="font-semibold text-[#135670] mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Objetivo Principal
                  </h4>
                  <p className="text-slate-700">
                    Centralizar informações de diferentes fontes, permitindo análises estratégicas em tempo real 
                    e facilitando a tomada de decisões baseada em dados consolidados.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Módulos do Sistema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: LayoutDashboard, titulo: 'Dashboard Consolidado', desc: 'Visão geral integrada de todos os sistemas' },
                      { icon: Briefcase, titulo: 'Visão Diretoria', desc: 'Indicadores estratégicos executivos' },
                      { icon: ShoppingCart, titulo: 'Dashboard Comercial', desc: 'Métricas de vendas e performance' },
                      { icon: Activity, titulo: 'Dashboard Operacional', desc: 'Eficiência operacional e produtividade' },
                      { icon: DollarSign, titulo: 'Gestão de Preços', desc: 'Análise de custos e margens' },
                      { icon: Database, titulo: 'Integrações', desc: 'Conexão com ERP e CRM' }
                    ].map((modulo, i) => (
                      <div key={i} className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#135670] to-[#ff5c00] flex items-center justify-center flex-shrink-0">
                          <modulo.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm">{modulo.titulo}</h4>
                          <p className="text-xs text-slate-600 mt-1">{modulo.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">Navegação no Sistema</h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    O menu lateral esquerdo oferece acesso rápido a todos os módulos. Cada seção possui submenus 
                    que se expandem automaticamente quando o módulo está ativo, facilitando a navegação entre diferentes 
                    visualizações e funcionalidades.
                  </p>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Dica:</strong> Use o botão "Recolher" no menu para ganhar mais espaço na tela durante análises detalhadas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Consolidado */}
          {secaoAtiva === 'dashboard' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-6 h-6 text-[#135670]" />
                  <CardTitle>2. Dashboard Consolidado</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  O Dashboard Consolidado é a tela principal do sistema, oferecendo uma visão integrada de todos os dados 
                  provenientes dos sistemas OMIE, WK, Mercos e Clic.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#ff5c00]" />
                    Cards de Métricas Principais
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <strong className="text-blue-900">Total de Produtos</strong>
                      </div>
                      <p className="text-sm text-slate-700">
                        Exibe a quantidade total de produtos cadastrados e ativos no sistema, consolidados de todas as fontes.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <strong className="text-green-900">Custo Médio</strong>
                      </div>
                      <p className="text-sm text-slate-700">
                        Apresenta o custo médio dos produtos, calculado automaticamente a partir dos dados de custo importados.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <strong className="text-purple-900">Margem Média</strong>
                      </div>
                      <p className="text-sm text-slate-700">
                        Mostra a margem de lucro média calculada com base na diferença entre preço de venda e custo. 
                        Inclui indicador de tendência (seta verde para crescimento).
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                        <strong className="text-orange-900">Novos Preços</strong>
                      </div>
                      <p className="text-sm text-slate-700">
                        Quantidade de produtos com novos preços sugeridos ou ajustados, aguardando aplicação.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#135670]" />
                    Arquitetura de Bancos de Dados
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    Visualização gráfica da estrutura de dados, mostrando como as informações fluem dos sistemas externos 
                    (OMIE, WK, Mercos, Clic) para o banco de dados centralizado do ORACULLO.
                  </p>
                  <div className="bg-slate-100 p-4 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <strong>Importante:</strong> Esta seção é informativa e mostra a arquitetura técnica do sistema. 
                      Não requer interação do usuário, mas ajuda a compreender a origem dos dados exibidos.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#ff5c00]" />
                    Consolidação de Sistemas
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    Painel que mostra o status de sincronização de cada sistema integrado:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700"><strong>OMIE (ERP):</strong> Dados financeiros e de estoque</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700"><strong>WK (ERP):</strong> Informações complementares de gestão</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700"><strong>Mercos (CRM):</strong> Dados de vendas e clientes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700"><strong>Clic (CRM):</strong> Informações comerciais complementares</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-[#135670]" />
                    Dashboard Editável
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    Funcionalidade que permite personalizar os widgets e gráficos exibidos no dashboard principal. 
                    Use o botão "Personalizar" no canto superior direito para ativar o modo de edição.
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Dica:</strong> Arraste e solte os widgets para reorganizá-los conforme sua preferência. 
                      As alterações são salvas automaticamente.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#ff5c00]" />
                    Análises Gráficas
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Abas que alternam entre diferentes visualizações de dados:
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#ff5c00] mt-1" />
                      <span className="text-slate-700"><strong>Visão Consolidada:</strong> Múltiplos gráficos lado a lado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#ff5c00] mt-1" />
                      <span className="text-slate-700"><strong>Análises Gráficas:</strong> Gráficos detalhados de margem e performance</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Ações Disponíveis</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <RefreshCw className="w-5 h-5 text-[#135670]" />
                      <div>
                        <strong className="text-sm text-slate-800">Sincronizar Dados</strong>
                        <p className="text-xs text-slate-600">Atualiza os dados de todas as integrações</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Edit3 className="w-5 h-5 text-[#ff5c00]" />
                      <div>
                        <strong className="text-sm text-slate-800">Personalizar</strong>
                        <p className="text-xs text-slate-600">Ativa modo de edição do dashboard</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visão Diretoria */}
          {secaoAtiva === 'diretoria' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-[#135670]" />
                  <CardTitle>3. Visão Diretoria</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  Dashboard executivo com indicadores estratégicos de alto nível para apoio à tomada de decisões da diretoria.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">KPIs Estratégicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        <strong className="text-emerald-900">Faturamento Anual</strong>
                      </div>
                      <p className="text-sm text-slate-700">
                        Receita total acumulada no ano, com comparação percentual em relação ao ano anterior.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <strong className="text-blue-900">Margem Operacional</strong>
                      </div>
                      <p className="text-sm text-slate-700">
                        Percentual de lucro operacional sobre o faturamento, indicando a eficiência da operação.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        <strong className="text-orange-900">ROI Geral</strong>
                      </div>
                      <p className="text-sm text-slate-700">
                        Retorno sobre investimento, medindo a rentabilidade dos recursos aplicados.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <strong className="text-purple-900">Crescimento</strong>
                      </div>
                      <p className="text-sm text-slate-700">
                        Taxa de crescimento geral do negócio comparado ao período anterior.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Gráficos Disponíveis</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Faturamento vs Meta</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Gráfico de área comparando o faturamento real com a meta estabelecida, incluindo indicadores de lucro líquido mensal.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Índice de Performance</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Gráfico radar mostrando performance em múltiplas dimensões: Vendas, Operações, Financeiro, Satisfação e Qualidade.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Distribuição de Receita</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Gráfico de pizza mostrando a distribuição percentual da receita entre Produtos, Serviços, Consultoria e Outros.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Comparativo Ano a Ano</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Gráfico de barras comparando performance trimestral entre o ano atual e o ano anterior.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Nota:</strong> Todos os gráficos são interativos. Posicione o cursor sobre os elementos para ver detalhes.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Comercial */}
          {secaoAtiva === 'comercial' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-[#135670]" />
                  <CardTitle>4. Dashboard Comercial</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  Painel focado em métricas de vendas e performance comercial da equipe.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Indicadores Comerciais</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <strong className="text-blue-900">Vendas do Mês</strong>
                      <p className="text-sm text-slate-700 mt-2">
                        Quantidade total de vendas realizadas no período atual, com percentual de crescimento.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <strong className="text-green-900">Ticket Médio</strong>
                      <p className="text-sm text-slate-700 mt-2">
                        Valor médio por venda, calculado dividindo o faturamento total pelo número de vendas.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <strong className="text-orange-900">Taxa de Conversão</strong>
                      <p className="text-sm text-slate-700 mt-2">
                        Percentual de leads que se convertem em vendas efetivas. Indicador crítico para avaliar eficiência comercial.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <strong className="text-purple-900">NPS (Net Promoter Score)</strong>
                      <p className="text-sm text-slate-700 mt-2">
                        Índice de satisfação dos clientes, medindo a probabilidade de recomendação da empresa.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Visualizações Analíticas</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <strong className="text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#ff5c00]" />
                        Evolução de Vendas e Ticket Médio
                      </strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Gráfico combinado mostrando a evolução do número de vendas (área) e do ticket médio (linha) ao longo dos meses.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <strong className="text-slate-800 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#ff5c00]" />
                        Pipeline de Vendas
                      </strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Funil mostrando a quantidade de oportunidades e valor em cada etapa: Prospecção, Qualificação, Proposta, Negociação e Fechamento.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <strong className="text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#135670]" />
                        Performance por Vendedor
                      </strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Gráfico de dispersão mostrando a relação entre número de vendas e ticket médio de cada vendedor, 
                        facilitando a identificação dos melhores performers.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <strong className="text-slate-800 flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#ff5c00]" />
                        Top Produtos
                      </strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Ranking dos produtos mais vendidos em termos de receita gerada.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Operacional */}
          {secaoAtiva === 'operacional' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-[#135670]" />
                  <CardTitle>5. Dashboard Operacional</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  Visualizações focadas em eficiência operacional, produtividade e gestão de processos.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Métricas Operacionais</h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    Este dashboard concentra informações sobre:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700">Eficiência de processos e tempo de ciclo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700">Produtividade da equipe operacional</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700">Indicadores de qualidade e retrabalho</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700">Utilização de recursos e capacidade</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Benefício:</strong> Permite identificar gargalos operacionais e oportunidades de otimização de processos.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gestão de Preços */}
          {secaoAtiva === 'gestaoprecos' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-[#135670]" />
                  <CardTitle>6. Gestão de Preços</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  Módulo dedicado à análise de custos versus preços de venda, permitindo otimização de margens.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Funcionalidades Principais</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Tabela Custo x Venda</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Visualização consolidada de todos os produtos com colunas de:
                      </p>
                      <ul className="mt-2 ml-4 space-y-1 text-sm text-slate-600">
                        <li>• Código e nome do produto</li>
                        <li>• Custo atual</li>
                        <li>• Preço de venda atual</li>
                        <li>• Margem percentual</li>
                        <li>• Novo preço sugerido (se aplicável)</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Ajuste de Margem</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Permite manipular margens de produtos de forma individual ou em lote, calculando automaticamente 
                        os novos preços de venda baseados na margem desejada.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Ações Disponíveis</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <FileDown className="w-5 h-5 text-[#135670]" />
                      <div>
                        <strong className="text-sm text-slate-800">Exportar Excel</strong>
                        <p className="text-xs text-slate-600">Gera planilha com todos os dados de produtos e preços</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Filter className="w-5 h-5 text-[#ff5c00]" />
                      <div>
                        <strong className="text-sm text-slate-800">Filtros</strong>
                        <p className="text-xs text-slate-600">Filtra produtos por categoria, margem ou origem</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Edit3 className="w-5 h-5 text-[#135670]" />
                      <div>
                        <strong className="text-sm text-slate-800">Edição Inline</strong>
                        <p className="text-xs text-slate-600">Permite editar preços diretamente na tabela</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Importante:</strong> Alterações de preços são sincronizadas com os sistemas ERP integrados. 
                    Sempre revise as mudanças antes de aplicar.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integrações */}
          {secaoAtiva === 'integracoes' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-[#135670]" />
                  <CardTitle>7. Integrações</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  Configuração e gerenciamento das conexões com sistemas externos (ERP e CRM).
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Sistemas Integrados</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <strong className="text-blue-900">OMIE (ERP)</strong>
                      <p className="text-sm text-slate-700 mt-2">
                        Integração com sistema OMIE para importação de dados financeiros, cadastro de produtos, 
                        estoque e movimentações contábeis.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <strong className="text-blue-900">WK (ERP)</strong>
                      <p className="text-sm text-slate-700 mt-2">
                        Conexão com WK para dados complementares de gestão empresarial e controles internos.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <strong className="text-green-900">Mercos (CRM)</strong>
                      <p className="text-sm text-slate-700 mt-2">
                        Integração com Mercos para dados de vendas B2B, pedidos de clientes e histórico comercial.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <strong className="text-green-900">Clic (CRM)</strong>
                      <p className="text-sm text-slate-700 mt-2">
                        Sincronização com Clic para informações adicionais de relacionamento com clientes.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Input Manual</h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    Para dados que não são cobertos pelas integrações automáticas, o sistema oferece formulários 
                    de entrada manual que alimentam o banco de dados centralizado.
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Plus className="w-5 h-5 text-[#135670]" />
                    <div>
                      <strong className="text-sm text-slate-800">Formulários</strong>
                      <p className="text-xs text-slate-600">Acesse a página "Input Manual" para inserir dados manualmente</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Sincronização</h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    As sincronizações acontecem automaticamente em intervalos programados, mas você pode forçar 
                    uma sincronização manual usando o botão "Sincronizar Dados" disponível nos dashboards.
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Dica:</strong> Sincronizações manuais são úteis quando você precisa de dados atualizados imediatamente, 
                      por exemplo, antes de uma reunião importante.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Relatórios */}
          {secaoAtiva === 'relatorios' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#135670]" />
                  <CardTitle>8. Relatórios</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  Geração de relatórios customizados e exportação de dados para análises externas.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Tipos de Relatórios</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Relatórios Consolidados</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Visão completa dos dados de múltiplas fontes em um único documento.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Relatórios por Período</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Análises temporais com comparativos entre diferentes períodos.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Relatórios Gerenciais</strong>
                      <p className="text-sm text-slate-600 mt-2">
                        Documentos formatados para apresentações executivas.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Exportação de Dados</h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    Diversos formatos de exportação estão disponíveis:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700"><strong>Excel:</strong> Para análises detalhadas e manipulação de dados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700"><strong>PDF:</strong> Para relatórios finalizados e apresentações</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700"><strong>CSV:</strong> Para integração com outras ferramentas</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Administração */}
          {secaoAtiva === 'administracao' && (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-[#135670]/5 to-[#ff5c00]/5">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-[#135670]" />
                  <CardTitle>9. Administração</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  Configurações do sistema, gestão de usuários e auditoria de atividades.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Gestão de Usuários</h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    Controle completo sobre quem tem acesso ao sistema:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700">Adicionar e remover usuários</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700">Definir permissões e níveis de acesso</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700">Atribuir usuários a departamentos específicos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-[#135670] mt-1" />
                      <span className="text-slate-700">Resetar senhas e gerenciar acessos</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Log de Atividades</h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    Registro completo de todas as ações realizadas no sistema para fins de auditoria e segurança:
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700"><strong>Quem:</strong> Identificação do usuário que realizou a ação</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700"><strong>O quê:</strong> Descrição da ação realizada</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700"><strong>Quando:</strong> Data e hora exata da atividade</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700"><strong>Onde:</strong> Módulo ou página onde a ação ocorreu</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Configurações Gerais</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Eye className="w-5 h-5 text-[#135670]" />
                      <div>
                        <strong className="text-sm text-slate-800">Tema</strong>
                        <p className="text-xs text-slate-600">Alternar entre modo claro e escuro</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Settings className="w-5 h-5 text-[#ff5c00]" />
                      <div>
                        <strong className="text-sm text-slate-800">Preferências</strong>
                        <p className="text-xs text-slate-600">Personalizar comportamento do sistema</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="text-sm text-red-800">
                    <strong>Atenção:</strong> Apenas usuários com perfil de Administrador têm acesso a esta seção. 
                    Alterações em configurações e usuários podem impactar o funcionamento do sistema.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer - Informações de Suporte */}
          <Card className="shadow-xl border-0 bg-gradient-to-r from-[#135670] to-[#ff5c00] text-white">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4">Suporte e Contato</h3>
              <div className="space-y-3">
                <p className="text-white/90">
                  Para dúvidas, sugestões ou suporte técnico, entre em contato com a equipe de TI da PEC Motors.
                </p>
                <div className="flex flex-col md:flex-row gap-4 mt-6">
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <strong className="text-white">Versão do Sistema</strong>
                    <p className="text-white/80 text-sm mt-1">ORACULLO v1.0 - 2025</p>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <strong className="text-white">Última Atualização</strong>
                    <p className="text-white/80 text-sm mt-1">Janeiro de 2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .sticky { position: static !important; }
          button { display: none !important; }
          .hidden { display: block !important; }
          .no-print { display: none !important; }
          body { background: white !important; }
          * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}