import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MargemChart({ produtos }) {
  const data = produtos.slice(0, 10).map(p => ({
    nome: p.nome?.substring(0, 15) + (p.nome?.length > 15 ? '...' : ''),
    margem: p.custo && p.preco_venda ? ((p.preco_venda - p.custo) / p.preco_venda * 100) : 0,
    custo: p.custo || 0,
    venda: p.preco_venda || 0
  }));

  const getBarColor = (margem) => {
    if (margem >= 40) return 'url(#greenGradient)';
    if (margem >= 25) return 'url(#orangeGradient)';
    return 'url(#redGradient)';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl shadow-2xl border border-orange-500/20"
        >
          <p className="font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            {label}
          </p>
          <div className="space-y-1.5 text-sm">
            <p className="text-slate-200">Margem: <span className="font-bold text-orange-400">{payload[0].value.toFixed(1)}%</span></p>
            <p className="text-slate-200">Custo: <span className="font-semibold text-emerald-400">R$ {payload[0].payload.custo.toFixed(2)}</span></p>
            <p className="text-slate-200">Venda: <span className="font-semibold text-blue-400">R$ {payload[0].payload.venda.toFixed(2)}</span></p>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-[#135670] to-[#ff5c00] text-white">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Margem por Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
                <defs>
                  <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff5c00" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ff9500" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="nome" 
                  width={120}
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 92, 0, 0.1)' }} />
                <Bar 
                  dataKey="margem" 
                  radius={[0, 8, 8, 0]}
                  animationDuration={1000}
                  animationBegin={100}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={getBarColor(entry.margem)}
                      style={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-8 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/30" />
              <span className="text-slate-700 font-medium">Ótima (≥40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#ff5c00] to-[#ff9500] shadow-lg shadow-orange-500/30" />
              <span className="text-slate-700 font-medium">Regular (25-40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-400 shadow-lg shadow-red-500/30" />
              <span className="text-slate-700 font-medium">Baixa (&lt;25%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}