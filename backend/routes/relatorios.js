import express from 'express';
import { pool as poolTransacional } from '../config/database-transacional.js';

const router = express.Router();

// Mapeamento de códigos OMIE para nomes de filiais
const FILIAIS_MAP = {
  '3170227616': 'Curitiba',
  '7134449262': 'Blumenau',
  '5846892828': 'Florianópolis',
  '7134439321': 'Joinville',
  '9978487136': 'Itajaí',
  '6340759822': 'Maringá',
  '11443025164': 'Minas Gerais',
  '2080955980': 'São Paulo'
};

// Endpoint: Faturamento Diário Resumido
router.get('/faturamento-diario', async (req, res) => {
  try {
    const { ano, mes } = req.query;
    
    if (!ano || !mes) {
      return res.status(400).json({ error: 'Ano e mês são obrigatórios' });
    }

    // Query para buscar faturamento diário por filial
    const query = `
      SELECT 
        DATE(data_pedido) as data,
        data_json->'cabecalho'->>'codigo_empresa' as codigo_filial,
        SUM(valor_total) as faturamento_dia,
        COUNT(*) as qtd_pedidos
      FROM pedidos
      WHERE 
        EXTRACT(YEAR FROM data_pedido) = $1
        AND EXTRACT(MONTH FROM data_pedido) = $2
        AND data_json->'infoCadastro'->>'faturado' = 'S'
      GROUP BY DATE(data_pedido), codigo_filial
      ORDER BY data, codigo_filial
    `;

    const result = await poolTransacional.query(query, [ano, mes]);

    // Organizar dados por dia e filial
    const diasDoMes = new Date(ano, mes, 0).getDate();
    const faturamentoPorDia = {};

    // Inicializar estrutura
    for (let dia = 1; dia <= diasDoMes; dia++) {
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      faturamentoPorDia[dataStr] = {
        data: dataStr,
        filiais: {},
        total_dia: 0
      };

      // Inicializar cada filial com 0
      Object.keys(FILIAIS_MAP).forEach(codigo => {
        faturamentoPorDia[dataStr].filiais[FILIAIS_MAP[codigo]] = {
          faturamento: 0,
          qtd_pedidos: 0,
          codigo_filial: codigo
        };
      });
    }

    // Preencher com dados reais
    result.rows.forEach(row => {
      const dataStr = row.data.toISOString().split('T')[0];
      const nomeFilial = FILIAIS_MAP[row.codigo_filial] || 'Outros';
      const faturamento = parseFloat(row.faturamento_dia) || 0;

      if (faturamentoPorDia[dataStr]) {
        faturamentoPorDia[dataStr].filiais[nomeFilial] = {
          faturamento: faturamento,
          qtd_pedidos: parseInt(row.qtd_pedidos),
          codigo_filial: row.codigo_filial
        };
        faturamentoPorDia[dataStr].total_dia += faturamento;
      }
    });

    // Calcular totais mensais por filial
    const totaisMensais = {};
    Object.keys(FILIAIS_MAP).forEach(codigo => {
      totaisMensais[FILIAIS_MAP[codigo]] = {
        faturamento_mes: 0,
        qtd_pedidos_mes: 0
      };
    });

    Object.values(faturamentoPorDia).forEach(dia => {
      Object.entries(dia.filiais).forEach(([nomeFilial, dados]) => {
        if (totaisMensais[nomeFilial]) {
          totaisMensais[nomeFilial].faturamento_mes += dados.faturamento;
          totaisMensais[nomeFilial].qtd_pedidos_mes += dados.qtd_pedidos;
        }
      });
    });

    // Adicionar dados de exemplo para Trading e ATF 6000 PRO
    const dadosExemplo = {
      trading: {
        'Lucara (PR)': { faturamento_mes: 25000, qtd_pedidos: 15, exemplo: true },
        'Bravo (MT)': { faturamento_mes: 18000, qtd_pedidos: 12, exemplo: true },
        'Super (RS)': { faturamento_mes: 42000, qtd_pedidos: 28, exemplo: true },
        'Viccalub (SP)': { faturamento_mes: 31000, qtd_pedidos: 20, exemplo: true },
        'Outros': { faturamento_mes: 15000, qtd_pedidos: 10, exemplo: true }
      },
      atf6000pro: {
        faturamento_mes: 125000,
        qtd_maquinas: 12,
        exemplo: true
      }
    };

    // Calcular total geral
    const totalDistribuicao = Object.values(totaisMensais).reduce((sum, f) => sum + f.faturamento_mes, 0);
    const totalTrading = Object.values(dadosExemplo.trading).reduce((sum, f) => sum + f.faturamento_mes, 0);
    const totalGeral = totalDistribuicao + totalTrading + dadosExemplo.atf6000pro.faturamento_mes;

    res.json({
      ano: parseInt(ano),
      mes: parseInt(mes),
      dias: Object.values(faturamentoPorDia),
      totais_mensais: {
        distribuicao: totaisMensais,
        trading: dadosExemplo.trading,
        atf6000pro: dadosExemplo.atf6000pro,
        total_distribuicao: totalDistribuicao,
        total_trading: totalTrading,
        total_atf6000pro: dadosExemplo.atf6000pro.faturamento_mes,
        total_geral: totalGeral
      },
      filiais_map: FILIAIS_MAP
    });

  } catch (error) {
    console.error('Erro ao buscar faturamento diário:', error);
    res.status(500).json({ error: 'Erro ao buscar faturamento diário', details: error.message });
  }
});

// Endpoint: Fechamento de Comissões
router.get('/fechamento-comissoes', async (req, res) => {
  try {
    const { ano, mes } = req.query;
    
    if (!ano || !mes) {
      return res.status(400).json({ error: 'Ano e mês são obrigatórios' });
    }

    // Query para buscar vendas por marca
    const queryVendas = `
      SELECT 
        p.marca,
        COUNT(DISTINCT pd.id) as qtd_vendas,
        SUM(pi.quantidade) as qtd_produtos,
        SUM(pi.valor_total) as valor_total,
        data_json->'cabecalho'->>'codigo_empresa' as codigo_filial
      FROM pedidos pd
      JOIN pedido_itens pi ON pd.id = pi.pedido_id
      JOIN produtos p ON pi.produto_id = p.id
      WHERE 
        EXTRACT(YEAR FROM pd.data_pedido) = $1
        AND EXTRACT(MONTH FROM pd.data_pedido) = $2
        AND pd.data_json->'infoCadastro'->>'faturado' = 'S'
      GROUP BY p.marca, codigo_filial
      ORDER BY valor_total DESC
    `;

    const resultVendas = await poolTransacional.query(queryVendas, [ano, mes]);

    // Vendedores de exemplo (baseado no Excel)
    const vendedoresExemplo = [
      { 
        nome: 'Schirlley Raupp Farinhas',
        regiao: 'Região Florianópolis',
        filial: 'Florianópolis',
        tipo: 'INTERNO',
        codigo_filial: '5846892828'
      },
      { 
        nome: 'Isaac Quadros',
        regiao: 'Região Blumenau',
        filial: 'Blumenau',
        tipo: 'EXTERNO',
        codigo_filial: '7134449262'
      },
      { 
        nome: 'Kailany Cristina',
        regiao: 'Região Campo Gerais',
        filial: 'Curitiba',
        tipo: 'INTERNO',
        codigo_filial: '3170227616'
      },
      { 
        nome: 'João Otavio de Souza Junior',
        regiao: 'Região Sul Curitiba',
        filial: 'Curitiba',
        tipo: 'INTERNO',
        codigo_filial: '3170227616'
      },
      { 
        nome: 'Wagner Catão',
        regiao: 'Região Oeste (Gov. Valadares)',
        filial: 'Minas Gerais',
        tipo: 'EXTERNO',
        codigo_filial: '11443025164'
      }
    ];

    // Organizar vendas por filial e marca
    const vendasPorFilial = {};
    resultVendas.rows.forEach(row => {
      const nomeFilial = FILIAIS_MAP[row.codigo_filial] || 'Outros';
      if (!vendasPorFilial[nomeFilial]) {
        vendasPorFilial[nomeFilial] = {
          total_vendido: 0,
          marcas: {}
        };
      }

      const marca = row.marca || 'SEM MARCA';
      if (!vendasPorFilial[nomeFilial].marcas[marca]) {
        vendasPorFilial[nomeFilial].marcas[marca] = {
          qtd_vendas: 0,
          qtd_produtos: 0,
          valor_total: 0
        };
      }

      vendasPorFilial[nomeFilial].marcas[marca].qtd_vendas += parseInt(row.qtd_vendas);
      vendasPorFilial[nomeFilial].marcas[marca].qtd_produtos += parseFloat(row.qtd_produtos);
      vendasPorFilial[nomeFilial].marcas[marca].valor_total += parseFloat(row.valor_total);
      vendasPorFilial[nomeFilial].total_vendido += parseFloat(row.valor_total);
    });

    // Atribuir vendas aos vendedores de exemplo
    const resumoVendedores = vendedoresExemplo.map(vendedor => {
      const vendasFilial = vendasPorFilial[vendedor.filial] || { total_vendido: 0, marcas: {} };
      
      // Metas de exemplo por marca
      const metasPorMarca = {
        'MANNOL': { meta: 240000, comissao: 0.01, premio: 0.02 },
        'LUBEGARD': { meta: 75000, comissao: 0.01, premio: 0.04 },
        'THE EAGLE': { meta: 30000, comissao: 0.01, premio: 0.04 },
        'RAVENOL': { meta: 50000, comissao: 0.01, premio: 0.04 }
      };

      const vendasPorMarca = {};
      Object.entries(vendasFilial.marcas).forEach(([marca, dados]) => {
        const metaMarca = metasPorMarca[marca] || { meta: 10000, comissao: 0.01, premio: 0.02 };
        const percentualAtingido = (dados.valor_total / metaMarca.meta) * 100;
        const comissaoCalculada = dados.valor_total * metaMarca.comissao;

        vendasPorMarca[marca] = {
          ...dados,
          meta: metaMarca.meta,
          percentual_atingido: percentualAtingido,
          comissao_percentual: metaMarca.comissao,
          comissao_valor: comissaoCalculada,
          exemplo_meta: true
        };
      });

      return {
        ...vendedor,
        total_vendido: vendasFilial.total_vendido,
        vendas_por_marca: vendasPorMarca,
        comissao_total: Object.values(vendasPorMarca).reduce((sum, m) => sum + m.comissao_valor, 0),
        exemplo: true
      };
    });

    res.json({
      ano: parseInt(ano),
      mes: parseInt(mes),
      vendedores: resumoVendedores,
      vendas_por_filial: vendasPorFilial,
      filiais_map: FILIAIS_MAP,
      aviso: 'Dados de vendedores, metas e comissões são exemplos fictícios'
    });

  } catch (error) {
    console.error('Erro ao buscar fechamento de comissões:', error);
    res.status(500).json({ error: 'Erro ao buscar fechamento de comissões', details: error.message });
  }
});

export default router;
