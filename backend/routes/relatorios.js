import express from 'express';
import { poolAnalitico, poolTransacional, poolGestao } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/relatorios/vendas-consolidado
 * Retorna vendas consolidadas por estado/filial
 * Query params: data_inicio, data_fim, filial_id (opcional)
 */
router.get('/vendas-consolidado', async (req, res) => {
  try {
    const { data_inicio, data_fim, filial_id } = req.query;
    
    // Se não especificar datas, usa o mês atual
    const hoje = new Date();
    const inicioMes = data_inicio || new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const fimMes = data_fim || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Buscar vendas por filial
    let query = `
      SELECT 
        v.integracao_id,
        i.nome as nome_filial,
        i.filial,
        i.config->>'estado' as estado,
        SUM(v.total_vendas) as total_vendas,
        SUM(v.total_pedidos) as total_pedidos,
        AVG(v.ticket_medio) as ticket_medio
      FROM vendas_por_periodo v
      INNER JOIN dblink(
        'dbname=oracullo_gestao user=oracullo_user password=oracullo123',
        'SELECT id, nome, filial, config FROM integracoes'
      ) AS i(id integer, nome text, filial text, config jsonb)
      ON v.integracao_id = i.id
      WHERE v.periodo BETWEEN $1 AND $2
    `;
    
    const params = [inicioMes, fimMes];
    
    if (filial_id) {
      query += ` AND v.integracao_id = $3`;
      params.push(filial_id);
    }
    
    query += `
      GROUP BY v.integracao_id, i.nome, i.filial, i.config
      ORDER BY estado, nome_filial
    `;
    
    const result = await poolAnalitico.query(query, params);
    
    // Agrupar por estado
    const estadosMap = new Map();
    
    result.rows.forEach(row => {
      const estado = row.estado || 'Não Informado';
      
      if (!estadosMap.has(estado)) {
        estadosMap.set(estado, {
          estado: estado,
          filiais: [],
          total_estado: 0
        });
      }
      
      const estadoData = estadosMap.get(estado);
      
      const filialData = {
        integracao_id: row.integracao_id,
        nome: row.nome_filial,
        filial: row.filial,
        total_vendas: parseFloat(row.total_vendas),
        total_pedidos: row.total_pedidos,
        ticket_medio: parseFloat(row.ticket_medio),
        vendedores: [] // Por enquanto vazio, implementar quando tivermos dados de vendedores
      };
      
      estadoData.filiais.push(filialData);
      estadoData.total_estado += filialData.total_vendas;
    });
    
    const estados = Array.from(estadosMap.values());
    const totalGeral = estados.reduce((sum, estado) => sum + estado.total_estado, 0);
    
    res.json({
      periodo: {
        inicio: inicioMes,
        fim: fimMes
      },
      estados: estados,
      total_geral: totalGeral
    });
    
  } catch (error) {
    console.error('Erro ao buscar vendas consolidado:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas consolidado' });
  }
});

/**
 * GET /api/relatorios/vendas-trading
 * Retorna vendas de trading/distribuição
 * Query params: data_inicio, data_fim
 */
router.get('/vendas-trading', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    const hoje = new Date();
    const inicioMes = data_inicio || new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const fimMes = data_fim || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Buscar integrações do tipo 'trading' ou 'distribuicao'
    const query = `
      SELECT 
        v.integracao_id,
        i.nome as distribuidor,
        SUM(v.total_vendas) as total_vendas,
        SUM(v.total_pedidos) as total_pedidos
      FROM vendas_por_periodo v
      INNER JOIN dblink(
        'dbname=oracullo_gestao user=oracullo_user password=oracullo123',
        'SELECT id, nome FROM integracoes WHERE config->>''tipo'' IN (''trading'', ''distribuicao'')'
      ) AS i(id integer, nome text)
      ON v.integracao_id = i.id
      WHERE v.periodo BETWEEN $1 AND $2
      GROUP BY v.integracao_id, i.nome
      ORDER BY total_vendas DESC
    `;
    
    const result = await poolAnalitico.query(query, [inicioMes, fimMes]);
    
    const totalTrading = result.rows.reduce((sum, row) => sum + parseFloat(row.total_vendas), 0);
    
    res.json({
      periodo: {
        inicio: inicioMes,
        fim: fimMes
      },
      distribuidores: result.rows.map(row => ({
        integracao_id: row.integracao_id,
        distribuidor: row.distribuidor,
        total_vendas: parseFloat(row.total_vendas),
        total_pedidos: row.total_pedidos
      })),
      total_trading: totalTrading
    });
    
  } catch (error) {
    console.error('Erro ao buscar vendas trading:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas trading' });
  }
});

/**
 * GET /api/relatorios/vendas-por-vendedor
 * Retorna vendas agrupadas por vendedor
 * Query params: data_inicio, data_fim, filial_id (opcional)
 */
router.get('/vendas-por-vendedor', async (req, res) => {
  try {
    const { data_inicio, data_fim, filial_id } = req.query;
    
    const hoje = new Date();
    const inicioMes = data_inicio || new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const fimMes = data_fim || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Por enquanto retorna estrutura vazia
    // Implementar quando tivermos tabela de vendedores e vendas por vendedor
    res.json({
      periodo: {
        inicio: inicioMes,
        fim: fimMes
      },
      vendedores: [],
      total: 0,
      mensagem: 'Dados de vendedores serão implementados quando houver sincronização de pedidos'
    });
    
  } catch (error) {
    console.error('Erro ao buscar vendas por vendedor:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas por vendedor' });
  }
});

/**
 * GET /api/relatorios/clientes-por-filial
 * Retorna distribuição de clientes por filial
 */
router.get('/clientes-por-filial', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.integracao_id,
        i.nome as nome_filial,
        i.filial,
        COUNT(*) as total_clientes,
        COUNT(*) FILTER (WHERE c.ativo = true) as clientes_ativos
      FROM clientes c
      INNER JOIN dblink(
        'dbname=oracullo_gestao user=oracullo_user password=oracullo123',
        'SELECT id, nome, filial FROM integracoes'
      ) AS i(id integer, nome text, filial text)
      ON c.integracao_id = i.id
      GROUP BY c.integracao_id, i.nome, i.filial
      ORDER BY total_clientes DESC
    `;
    
    const result = await poolTransacional.query(query);
    
    const totalGeral = result.rows.reduce((sum, row) => sum + parseInt(row.total_clientes), 0);
    
    res.json({
      filiais: result.rows.map(row => ({
        integracao_id: row.integracao_id,
        nome: row.nome_filial,
        filial: row.filial,
        total_clientes: parseInt(row.total_clientes),
        clientes_ativos: parseInt(row.clientes_ativos)
      })),
      total_geral: totalGeral
    });
    
  } catch (error) {
    console.error('Erro ao buscar clientes por filial:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes por filial' });
  }
});

/**
 * GET /api/relatorios/produtos-mais-vendidos
 * Retorna produtos mais vendidos no período
 * Query params: data_inicio, data_fim, limite (padrão 20)
 */
router.get('/produtos-mais-vendidos', async (req, res) => {
  try {
    const { data_inicio, data_fim, limite = 20 } = req.query;
    
    // Por enquanto retorna produtos cadastrados
    // Implementar quando tivermos dados de vendas por produto
    const query = `
      SELECT 
        p.id,
        p.codigo_externo,
        p.descricao,
        p.unidade,
        p.preco_venda,
        p.custo,
        i.nome as filial
      FROM produtos p
      INNER JOIN dblink(
        'dbname=oracullo_gestao user=oracullo_user password=oracullo123',
        'SELECT id, nome FROM integracoes'
      ) AS i(id integer, nome text)
      ON p.integracao_id = i.id
      WHERE p.ativo = true
      ORDER BY p.descricao
      LIMIT $1
    `;
    
    const result = await poolTransacional.query(query, [parseInt(limite)]);
    
    res.json({
      limite: parseInt(limite),
      produtos: result.rows.map(row => ({
        id: row.id,
        codigo: row.codigo_externo,
        descricao: row.descricao,
        unidade: row.unidade,
        preco_venda: parseFloat(row.preco_venda || 0),
        custo: parseFloat(row.custo || 0),
        filial: row.filial,
        quantidade_vendida: 0, // Implementar quando houver dados
        valor_total: 0 // Implementar quando houver dados
      })),
      mensagem: 'Dados de vendas por produto serão implementados quando houver sincronização de pedidos'
    });
    
  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos mais vendidos' });
  }
});

/**
 * GET /api/relatorios/resumo-geral
 * Retorna resumo geral para relatórios
 * Query params: data_inicio, data_fim
 */
router.get('/resumo-geral', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    const hoje = new Date();
    const inicioMes = data_inicio || new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const fimMes = data_fim || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Total de vendas no período
    const vendasQuery = `
      SELECT 
        SUM(total_vendas) as total_vendas,
        SUM(total_pedidos) as total_pedidos,
        AVG(ticket_medio) as ticket_medio
      FROM vendas_por_periodo
      WHERE periodo BETWEEN $1 AND $2
    `;
    
    const vendasResult = await poolAnalitico.query(vendasQuery, [inicioMes, fimMes]);
    
    // Total de clientes ativos
    const clientesResult = await poolTransacional.query(
      'SELECT COUNT(*) as total FROM clientes WHERE ativo = true'
    );
    
    // Total de produtos ativos
    const produtosResult = await poolTransacional.query(
      'SELECT COUNT(*) as total FROM produtos WHERE ativo = true'
    );
    
    // Total de integrações ativas
    const integracoesResult = await poolGestao.query(
      'SELECT COUNT(*) as total FROM integracoes WHERE status = \'conectado\''
    );
    
    const vendas = vendasResult.rows[0];
    
    res.json({
      periodo: {
        inicio: inicioMes,
        fim: fimMes
      },
      resumo: {
        total_vendas: parseFloat(vendas.total_vendas || 0),
        total_pedidos: parseInt(vendas.total_pedidos || 0),
        ticket_medio: parseFloat(vendas.ticket_medio || 0),
        total_clientes: parseInt(clientesResult.rows[0].total),
        total_produtos: parseInt(produtosResult.rows[0].total),
        integracoes_ativas: parseInt(integracoesResult.rows[0].total)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar resumo geral:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo geral' });
  }
});

export default router;
