import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { motion } from "framer-motion";

export default function KPICard({ kpi, index }) {
  const variacao = kpi.valor_atual && kpi.valor_anterior 
    ? ((kpi.valor_atual - kpi.valor_anterior) / kpi.valor_anterior * 100) 
    : 0;
  
  const atingimentoMeta = kpi.valor_meta 
    ? (kpi.valor_atual / kpi.valor_meta * 100) 
    : 0;

  const formatarValor = (valor) => {
    if (!valor) return '0';
    switch (kpi.unidade) {
      case 'reais':
        return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      case 'percentual':
        return `${valor.toFixed(1)}%`;
      case 'dias':
        return `${valor} dias`;
      default:
        return valor.toLocaleString('pt-BR');
    }
  };

  const corCategoria = {
    financeiro: 'from-emerald-500 to-emerald-600',
    comercial: 'from-blue-500 to-blue-600',
    operacional: 'from-purple-500 to-purple-600',
    estoque: 'from-orange-500 to-orange-600',
    margem: 'from-pink-500 to-pink-600'
  };

  const isPositivo = variacao >= 0;
  const atingiuMeta = atingimentoMeta >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${corCategoria[kpi.categoria]}`} />
        <CardContent className="p-6 pl-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">
                {kpi.nome}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-800">
                  {formatarValor(kpi.valor_atual)}
                </p>
                {kpi.valor_anterior && (
                  <div className={`flex items-center gap-1 text-sm ${isPositivo ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositivo ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-medium">{Math.abs(variacao).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant="outline" className="capitalize text-xs">
              {kpi.fonte}
            </Badge>
          </div>

          {kpi.valor_meta && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Meta
                </span>
                <span className={`font-medium ${atingiuMeta ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {formatarValor(kpi.valor_meta)}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    atingiuMeta 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                      : 'bg-gradient-to-r from-amber-500 to-amber-600'
                  }`}
                  style={{ width: `${Math.min(atingimentoMeta, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Atingimento</span>
                <span className={`font-semibold ${atingiuMeta ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {atingimentoMeta.toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <Badge variant="secondary" className="text-xs capitalize">
              {kpi.area_responsavel}
            </Badge>
            {kpi.periodo && (
              <span className="text-xs text-slate-400">
                {new Date(kpi.periodo).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}