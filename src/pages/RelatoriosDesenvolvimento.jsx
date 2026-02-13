import React from 'react';
import { Construction } from 'lucide-react';

const RelatoriosDesenvolvimento = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Relatórios em Desenvolvimento
          </h1>
          <p className="text-slate-400">
            Novos relatórios e funcionalidades em breve
          </p>
        </div>

        {/* Card de Em Implementação */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Construction className="w-24 h-24 text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"></div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            Em Implementação
          </h2>
          
          <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">
            Estamos trabalhando em novos relatórios e funcionalidades para melhorar sua experiência.
          </p>
          
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 rounded-full text-slate-300">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Aguarde novidades em breve</span>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">📊</div>
            <h3 className="text-white font-semibold mb-1">Análises Avançadas</h3>
            <p className="text-slate-400 text-sm">Novos dashboards e métricas</p>
          </div>
          
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">📈</div>
            <h3 className="text-white font-semibold mb-1">Indicadores</h3>
            <p className="text-slate-400 text-sm">KPIs e performance</p>
          </div>
          
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">🎯</div>
            <h3 className="text-white font-semibold mb-1">Personalizados</h3>
            <p className="text-slate-400 text-sm">Relatórios sob medida</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosDesenvolvimento;
