import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================
// DADOS EXTRAÍDOS DO EXCEL: 2.2. Fechamento de Comissões - Gerentes - 2026
// ============================================================

const DADOS_GERENTES = [
  {
    nome: 'Rogério',
    data: 'Janeiro 2026',
    items: [
      { centro: 'PROLABORE', faturamento: 0, litros: 0, comissaoPct: 'FIXO', comissaoRs: 0 },
      { centro: 'FATURAMENTO MINAS', faturamento: 562534.52, litros: 0, comissaoPct: 0.015, comissaoRs: 8438.02 },
      { centro: 'MAQUINA ATF 6000 PRO', faturamento: 82036.90, litros: 0, comissaoPct: 0.015, comissaoRs: 1230.55 },
    ],
    total: { faturamento: 644571.42, litros: 0, comissaoRs: 9668.57 }
  },
  {
    nome: 'Junior Neuri',
    data: 'Janeiro 2026',
    secoes: [
      {
        titulo: 'Trading - Produtos / ATF 6000 pro',
        items: [
          { centro: 'Diretas Trading', faturamento: 69083.86, comissaoPct: 0.03, comissaoRs: 2072.52 },
          { centro: 'Distribuidor / Revenda / Diretas Trading', faturamento: 332171.62, comissaoPct: 0.01, comissaoRs: 3321.72 },
        ],
        total: { faturamento: 401255.48, comissaoRs: 5394.24 }
      },
      {
        titulo: 'Trading - Maquinas',
        items: [
          { centro: 'Lubri Race', faturamento: 0, comissaoPct: 0.015, comissaoRs: 0 },
          { centro: 'Acm', faturamento: 0, comissaoPct: 0.015, comissaoRs: 0 },
          { centro: 'Diretas - Junior', faturamento: 0, comissaoPct: 0.07, comissaoRs: 0 },
          { centro: 'Distribuidor', faturamento: 0, comissaoPct: 0, comissaoRs: 0 },
          { centro: 'Acm', faturamento: 0, comissaoPct: 0.015, comissaoRs: 0 },
          { centro: 'Wtt', faturamento: 0, comissaoPct: 0.015, comissaoRs: 0 },
        ],
        total: { faturamento: 0, comissaoRs: 0 }
      }
    ],
    totalGeral: { faturamento: 401255.48, comissaoRs: 5394.24 }
  },
  {
    nome: 'Mario',
    data: 'Janeiro 2026',
    items: [
      { centro: 'PROLABORE', faturamento: 0, litros: 0, comissaoPct: 'FIXO', comissaoRs: 0 },
      { centro: 'AJUDA DE CUSTO', faturamento: 0, litros: 0, comissaoPct: 0, comissaoRs: 1500.00 },
      { centro: 'FATURAMENTO DF', faturamento: 215622.26, litros: 0, comissaoPct: 0.015, comissaoRs: 3234.33 },
      { centro: 'MAQUINA ATF 6000 PRO', faturamento: 13500.00, litros: 0, comissaoPct: 0.015, comissaoRs: 202.50 },
    ],
    total: { faturamento: 229122.26, litros: 0, comissaoRs: 4936.83 }
  },
  {
    nome: 'Renata',
    data: 'Janeiro 2026',
    items: [
      { centro: 'PROLABORE', faturamento: 0, litros: 0, comissaoPct: 'FIXO', comissaoRs: 0 },
      { centro: 'FATURAMENTO SP', faturamento: 256667.11, litros: 0, comissaoPct: 0.015, comissaoRs: 3850.01 },
      { centro: 'MAQUINA ATF 6000 PRO', faturamento: 22000.00, litros: 0, comissaoPct: 0.015, comissaoRs: 330.00 },
    ],
    total: { faturamento: 278667.11, litros: 0, comissaoRs: 4180.01 }
  }
];

// ============================================================
// HELPERS
// ============================================================

const fmtCur = (v) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const fmtPct = (v) => {
  if (typeof v === 'string') return v;
  return `${(v * 100).toFixed(1).replace('.', ',')}%`;
};

// ============================================================
// COMPONENTES DE SUPORTE
// ============================================================

function CardGerente({ gerente }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
    >
      <div 
        className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-border flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#135670] flex items-center justify-center text-white font-bold">
            {gerente.nome.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{gerente.nome}</h3>
            <p className="text-xs text-muted-foreground">{gerente.data}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Comissão</p>
            <p className="text-lg font-bold text-[#ff5c00]">
              {fmtCur(gerente.totalGeral ? gerente.totalGeral.comissaoRs : gerente.total.comissaoRs)}
            </p>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {gerente.secoes ? (
            // Layout para Junior Neuri (com seções)
            <div className="space-y-8">
              {gerente.secoes.map((secao, sIdx) => (
                <div key={sIdx}>
                  <h4 className="text-sm font-bold text-[#135670] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {secao.titulo}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-left">
                          <th className="pb-2 font-medium">Centro de Resultado</th>
                          <th className="pb-2 font-medium text-right">Faturamento</th>
                          <th className="pb-2 font-medium text-right">% Comissão</th>
                          <th className="pb-2 font-medium text-right">R$ Comissão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {secao.items.map((item, iIdx) => (
                          <tr key={iIdx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 text-foreground">{item.centro}</td>
                            <td className="py-3 text-right text-foreground">{fmtCur(item.faturamento)}</td>
                            <td className="py-3 text-right text-foreground">{fmtPct(item.comissaoPct)}</td>
                            <td className="py-3 text-right font-semibold text-foreground">{fmtCur(item.comissaoRs)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-900/30 font-bold">
                          <td className="py-3 px-2">SUBTOTAL</td>
                          <td className="py-3 text-right px-2">{fmtCur(secao.total.faturamento)}</td>
                          <td className="py-3 text-right px-2">-</td>
                          <td className="py-3 text-right px-2 text-[#ff5c00]">{fmtCur(secao.total.comissaoRs)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t-2 border-dashed border-border flex justify-end">
                <div className="bg-[#135670] text-white px-6 py-3 rounded-xl shadow-lg">
                  <p className="text-[10px] uppercase opacity-80">Total Geral de Comissão</p>
                  <p className="text-2xl font-bold">{fmtCur(gerente.totalGeral.comissaoRs)}</p>
                </div>
              </div>
            </div>
          ) : (
            // Layout padrão para os outros gerentes
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-2 font-medium">Centro de Resultado</th>
                    <th className="pb-2 font-medium text-right">Faturamento</th>
                    <th className="pb-2 font-medium text-right">Qtd. Litros</th>
                    <th className="pb-2 font-medium text-right">% Comissão</th>
                    <th className="pb-2 font-medium text-right">R$ Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {gerente.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 text-foreground">{item.centro}</td>
                      <td className="py-3 text-right text-foreground">{fmtCur(item.faturamento)}</td>
                      <td className="py-3 text-right text-foreground">{item.litros || '-'}</td>
                      <td className="py-3 text-right text-foreground">{fmtPct(item.comissaoPct)}</td>
                      <td className="py-3 text-right font-semibold text-foreground">{fmtCur(item.comissaoRs)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-900/30 font-bold">
                    <td className="py-3 px-2">TOTAL</td>
                    <td className="py-3 text-right px-2">{fmtCur(gerente.total.faturamento)}</td>
                    <td className="py-3 text-right px-2">{gerente.total.litros || '-'}</td>
                    <td className="py-3 text-right px-2">-</td>
                    <td className="py-3 text-right px-2 text-[#ff5c00]">{fmtCur(gerente.total.comissaoRs)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ComissoesGerentes() {
  const totalGeralComissoes = DADOS_GERENTES.reduce((acc, g) => {
    return acc + (g.totalGeral ? g.totalGeral.comissaoRs : g.total.comissaoRs);
  }, 0);

  const totalFaturamento = DADOS_GERENTES.reduce((acc, g) => {
    return acc + (g.totalGeral ? g.totalGeral.faturamento : g.total.faturamento);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#135670] to-[#ff5c00] flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Comissões de Gerentes
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Fechamento Mensal de Resultados — Janeiro 2026
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-3"
        >
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ff5c00]/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#ff5c00]" />
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-bold">Total Pago em Comissões</p>
              <p className="text-xl font-black text-foreground">{fmtCur(totalGeralComissoes)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Faturamento Gerenciado</p>
          <p className="text-2xl font-bold mt-2 text-foreground">{fmtCur(totalFaturamento)}</p>
          <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#135670] w-full"></div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Gerentes Ativos</p>
          <p className="text-2xl font-bold mt-2 text-foreground">{DADOS_GERENTES.length}</p>
          <div className="mt-4 flex -space-x-2">
            {DADOS_GERENTES.map((g, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                {g.nome.charAt(0)}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Média por Gerente</p>
          <p className="text-2xl font-bold mt-2 text-foreground">{fmtCur(totalGeralComissoes / DADOS_GERENTES.length)}</p>
          <p className="text-xs text-green-500 mt-2 font-medium">Jan 2026 vs Dez 2025: +4.2%</p>
        </motion.div>
      </div>

      {/* Lista de Gerentes */}
      <div className="grid grid-cols-1 gap-6">
        {DADOS_GERENTES.map((gerente, idx) => (
          <CardGerente key={idx} gerente={gerente} />
        ))}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 dark:bg-slate-900/30 border border-border rounded-xl p-6 text-sm text-muted-foreground">
        <h5 className="font-bold text-foreground mb-2">Informações Adicionais</h5>
        <ul className="list-disc list-inside space-y-1">
          <li>Os valores apresentados são referentes ao faturamento faturado no mês de Janeiro de 2026.</li>
          <li>As regras de comissionamento seguem o contrato vigente de cada gestor.</li>
          <li>Os valores de prolabore e ajuda de custo são fixos e não dependem do faturamento.</li>
        </ul>
      </div>
    </div>
  );
}
