import express from 'express';
import { poolTransacional } from '../config/databases.js';

const router = express.Router();

// GET /api/comercial/kpis - KPIs comerciais
router.get('/kpis', async (req, res) => {
  try {
    const { periodo = new Date().getFullYear() } = req.query;
    
    console.log('[COMERCIAL] Buscando KPIs para período:', periodo);

    // Vendas do mês atual
    const vendasMes = await poolTransacional.query(`
      SELECT COUNT(*) as total_vendas
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
        AND EXTRACT(MONTH FROM data_pedido) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND status NOT IN ('cancelado', 'rejeitado')
    `, [parseInt(periodo)]);
    
    console.log('[COMERCIAL] Vendas do mês:', vendasMes.rows[0]);

    // Ticket médio
    const ticketMedio = await poolTransacional.query(`
      SELECT AVG(valor_total) as ticket_medio
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
        AND EXTRACT(MONTH FROM data_pedido) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND status NOT IN ('cancelado', 'rejeitado')
    `, [parseInt(periodo)]);
    
    console.log('[COMERCIAL] Ticket médio:', ticketMedio.rows[0]);

    // Taxa de conversão (pedidos / clientes únicos)
    const conversao = await poolTransacional.query(`
      SELECT 
        COUNT(DISTINCT cliente_id) as total_clientes,
        COUNT(*) as total_pedidos
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
        AND EXTRACT(MONTH FROM data_pedido) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND status NOT IN ('cancelado', 'rejeitado')
    `, [parseInt(periodo)]);
    
    console.log('[COMERCIAL] Conversão:', conversao.rows[0]);

    const taxaConversao = conversao.rows[0].total_clientes > 0 
      ? Number((conversao.rows[0].total_pedidos / conversao.rows[0].total_clientes * 100).toFixed(1))
      : 0;

    // NPS (mockado por enquanto - requer tabela de pesquisas)
    const nps = 85;

    const result = {
      vendas_mes: Number(vendasMes.rows[0].total_vendas) || 0,
      ticket_medio: Number(ticketMedio.rows[0].ticket_medio) || 0,
      taxa_conversao: taxaConversao,
      nps: nps
    };
    
    console.log('[COMERCIAL] KPIs resultado:', result);
    
    res.json(result);
  } catch (error) {
    console.error('[COMERCIAL] Erro ao buscar KPIs:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs comerciais', details: error.message });
  }
});

// GET /api/comercial/vendas-mensais - Evolução mensal de vendas
router.get('/vendas-mensais', async (req, res) => {
  try {
    const { periodo = new Date().getFullYear() } = req.query;
    
    console.log('[COMERCIAL] Buscando vendas mensais para:', periodo);

    const vendas = await poolTransacional.query(`
      SELECT 
        TO_CHAR(data_pedido, 'Mon') as mes,
        COUNT(*) as vendas,
        AVG(valor_total) as ticket
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
        AND status NOT IN ('cancelado', 'rejeitado')
      GROUP BY TO_CHAR(data_pedido, 'Mon'), EXTRACT(MONTH FROM data_pedido)
      ORDER BY EXTRACT(MONTH FROM data_pedido)
    `, [parseInt(periodo)]);
    
    console.log('[COMERCIAL] Vendas mensais encontradas:', vendas.rows.length);

    res.json(vendas.rows.map(row => ({
      mes: row.mes,
      vendas: Number(row.vendas),
      ticket: Number(row.ticket || 0).toFixed(2)
    })));
  } catch (error) {
    console.error('[COMERCIAL] Erro ao buscar vendas mensais:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas mensais', details: error.message });
  }
});

// GET /api/comercial/pipeline - Pipeline de vendas por status
router.get('/pipeline', async (req, res) => {
  try {
    const { periodo = new Date().getFullYear() } = req.query;
    
    console.log('[COMERCIAL] Buscando pipeline para:', periodo);

    const pipeline = await poolTransacional.query(`
      SELECT 
        status as etapa,
        COUNT(*) as quantidade,
        SUM(valor_total) as valor
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'prospeccao' THEN 1
          WHEN 'qualificacao' THEN 2
          WHEN 'proposta' THEN 3
          WHEN 'negociacao' THEN 4
          WHEN 'fechado' THEN 5
          ELSE 6
        END
    `, [parseInt(periodo)]);
    
    console.log('[COMERCIAL] Pipeline encontrado:', pipeline.rows.length, 'etapas');

    res.json(pipeline.rows.map(row => ({
      etapa: row.etapa,
      quantidade: Number(row.quantidade),
      valor: Number(row.valor || 0)
    })));
  } catch (error) {
    console.error('[COMERCIAL] Erro ao buscar pipeline:', error);
    res.status(500).json({ error: 'Erro ao buscar pipeline', details: error.message });
  }
});

// GET /api/comercial/top-produtos - Top produtos por receita
router.get('/top-produtos', async (req, res) => {
  try {
    const { periodo = new Date().getFullYear(), limit = 5 } = req.query;
    
    console.log('[COMERCIAL] Buscando top produtos para:', periodo, 'limit:', limit);

    // Extrai produtos do campo data_json->det
    const produtos = await poolTransacional.query(`
      WITH itens_pedidos AS (
        SELECT 
          jsonb_array_elements(data_json->'det') AS item,
          data_pedido
        FROM pedidos
        WHERE EXTRACT(YEAR FROM data_pedido) = $1
          AND status NOT IN ('cancelado', 'rejeitado')
          AND data_json->'det' IS NOT NULL
      )
      SELECT 
        item->'produto'->>'descricao' AS produto,
        item->'produto'->>'codigo' AS codigo,
        COUNT(*) AS vendas,
        SUM((item->'produto'->>'valor_total')::numeric) AS receita
      FROM itens_pedidos
      GROUP BY item->'produto'->>'descricao', item->'produto'->>'codigo'
      ORDER BY receita DESC
      LIMIT $2
    `, [parseInt(periodo), parseInt(limit)]);
    
    console.log('[COMERCIAL] Top produtos encontrados:', produtos.rows.length);

    res.json(produtos.rows.map(row => {
      // Trunca nome em 10 caracteres
      const nomeTruncado = row.produto.length > 10 
        ? row.produto.substring(0, 10) + '...'
        : row.produto;
      
      return {
        produto: nomeTruncado,
        codigo: row.codigo,
        vendas: Number(row.vendas),
        receita: Number(row.receita || 0)
      };
    }));
  } catch (error) {
    console.error('[COMERCIAL] Erro ao buscar top produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar top produtos', details: error.message });
  }
});

// GET /api/comercial/vendedores - Performance por vendedor (mockado)
router.get('/vendedores', async (req, res) => {
  try {
    // Dados mockados - requer tabela de vendedores
    const vendedores = [
      { vendedor: 'João', vendas: 45, ticket: 2400 },
      { vendedor: 'Maria', vendas: 38, ticket: 2100 },
      { vendedor: 'Pedro', vendas: 35, ticket: 1900 },
      { vendedor: 'Ana', vendas: 42, ticket: 2300 },
      { vendedor: 'Carlos', vendas: 40, ticket: 2000 }
    ];
    
    res.json(vendedores);
  } catch (error) {
    console.error('[COMERCIAL] Erro ao buscar vendedores:', error);
    res.status(500).json({ error: 'Erro ao buscar vendedores', details: error.message });
  }
});

export default router;
