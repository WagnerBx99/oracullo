import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3201';

const RelatoriosDesenvolvimento = () => {
  const [relatorioAtivo, setRelatorioAtivo] = useState('faturamento');
  const [loading, setLoading] = useState(false);
  const [dadosFaturamento, setDadosFaturamento] = useState(null);
  const [dadosComissoes, setDadosComissoes] = useState(null);
  const [mesAno, setMesAno] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });

  useEffect(() => {
    if (relatorioAtivo === 'faturamento') {
      buscarFaturamento();
    } else {
      buscarComissoes();
    }
  }, [relatorioAtivo, mesAno]);

  const buscarFaturamento = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/relatorios/faturamento-diario`, {
        params: { ano: mesAno.ano, mes: mesAno.mes }
      });
      setDadosFaturamento(response.data);
    } catch (error) {
      console.error('Erro ao buscar faturamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarComissoes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/relatorios/fechamento-comissoes`, {
        params: { ano: mesAno.ano, mes: mesAno.mes }
      });
      setDadosComissoes(response.data);
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const meses = [
    { valor: 1, nome: 'Janeiro' }, { valor: 2, nome: 'Fevereiro' }, { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' }, { valor: 5, nome: 'Maio' }, { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' }, { valor: 8, nome: 'Agosto' }, { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' }, { valor: 11, nome: 'Novembro' }, { valor: 12, nome: 'Dezembro' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Relatórios em Desenvolvimento</h1>
          <p className="text-slate-400">Novos relatórios com dados reais das integrações</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setRelatorioAtivo('faturamento')}
            className={`p-6 rounded-xl border-2 transition-all ${
              relatorioAtivo === 'faturamento' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-8 h-8 mb-2 text-blue-400" />
            <h3 className="text-xl font-bold text-white mb-1">Faturamento Diário</h3>
            <p className="text-slate-400 text-sm">Resumo diário por filial</p>
          </button>

          <button
            onClick={() => setRelatorioAtivo('comissoes')}
            className={`p-6 rounded-xl border-2 transition-all ${
              relatorioAtivo === 'comissoes' ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <Users className="w-8 h-8 mb-2 text-green-400" />
            <h3 className="text-xl font-bold text-white mb-1">Fechamento de Comissões</h3>
            <p className="text-slate-400 text-sm">Vendas por vendedor</p>
          </button>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-slate-400" />
            <select value={mesAno.mes} onChange={(e) => setMesAno({ ...mesAno, mes: parseInt(e.target.value) })}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg">
              {meses.map(m => <option key={m.valor} value={m.valor}>{m.nome}</option>)}
            </select>
            <input type="number" value={mesAno.ano} onChange={(e) => setMesAno({ ...mesAno, ano: parseInt(e.target.value) })}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg w-24" min="2020" max="2030" />
          </div>
        </div>

        {loading ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando dados...</p>
          </div>
        ) : relatorioAtivo === 'faturamento' && dadosFaturamento ? (
          <RelatorioFaturamento dados={dadosFaturamento} formatarMoeda={formatarMoeda} />
        ) : relatorioAtivo === 'comissoes' && dadosComissoes ? (
          <RelatorioComissoes dados={dadosComissoes} formatarMoeda={formatarMoeda} />
        ) : null}
      </div>
    </div>
  );
};

const RelatorioFaturamento = ({ dados, formatarMoeda }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
        <DollarSign className="w-8 h-8 text-blue-400 mb-2" />
        <p className="text-slate-300 text-sm mb-1">Distribuição</p>
        <p className="text-2xl font-bold text-white">{formatarMoeda(dados.totais_mensais.total_distribuicao)}</p>
      </div>
      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
        <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
        <p className="text-slate-300 text-sm mb-1">Trading</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-white">{formatarMoeda(dados.totais_mensais.total_trading)}</p>
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">EXEMPLO</span>
        </div>
      </div>
      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
        <Users className="w-8 h-8 text-purple-400 mb-2" />
        <p className="text-slate-300 text-sm mb-1">ATF 6000 PRO</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-white">{formatarMoeda(dados.totais_mensais.total_atf6000pro)}</p>
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">EXEMPLO</span>
        </div>
      </div>
      <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6">
        <DollarSign className="w-8 h-8 text-orange-400 mb-2" />
        <p className="text-slate-300 text-sm mb-1">Total Geral</p>
        <p className="text-2xl font-bold text-white">{formatarMoeda(dados.totais_mensais.total_geral)}</p>
      </div>
    </div>

    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <h3 className="text-xl font-bold text-white">Faturamento Mensal por Filial</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Filial</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Faturamento</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Pedidos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {Object.entries(dados.totais_mensais.distribuicao).map(([filial, d]) => (
              <tr key={filial} className="hover:bg-slate-700/30">
                <td className="px-6 py-4 text-white">{filial}</td>
                <td className="px-6 py-4 text-right text-white font-semibold">{formatarMoeda(d.faturamento_mes)}</td>
                <td className="px-6 py-4 text-right text-slate-300">{d.qtd_pedidos_mes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-400" />
      <div>
        <p className="text-yellow-400 font-semibold mb-1">Dados Parciais</p>
        <p className="text-yellow-300/80 text-sm">
          Os valores de Trading e ATF 6000 PRO são exemplos. Distribuição são dados reais.
        </p>
      </div>
    </div>
  </div>
);

const RelatorioComissoes = ({ dados, formatarMoeda }) => (
  <div className="space-y-6">
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-400" />
      <div>
        <p className="text-yellow-400 font-semibold mb-1">Dados de Exemplo</p>
        <p className="text-yellow-300/80 text-sm">{dados.aviso}</p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {dados.vendedores.map((v, idx) => (
        <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">{v.nome}</h3>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">EXEMPLO</span>
              </div>
              <p className="text-slate-400 text-sm">{v.regiao} • {v.filial}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm mb-1">Total Vendido</p>
              <p className="text-2xl font-bold text-white">{formatarMoeda(v.total_vendido)}</p>
              <p className="text-green-400 text-sm mt-1">Comissão: {formatarMoeda(v.comissao_total)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(v.vendas_por_marca).map(([marca, d]) => (
              <div key={marca} className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-white">{marca}</span>
                  <span className="text-slate-300">{formatarMoeda(d.valor_total)}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Meta</p>
                    <p className="text-white">{formatarMoeda(d.meta)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">% Atingido</p>
                    <p className={d.percentual_atingido >= 100 ? 'text-green-400' : 'text-yellow-400'}>
                      {d.percentual_atingido.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Comissão</p>
                    <p className="text-green-400">{formatarMoeda(d.comissao_valor)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RelatoriosDesenvolvimento;
