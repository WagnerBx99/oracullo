import express from 'express';
import { poolAnalitico, poolTransacional, poolGestao } from '../config/databases.js';

const router = express.Router();

/**
 * GET /api/dashboard/kpis
 * Retorna KPIs consolidados do período
 * Query params: periodo (YYYY-MM), filial_id (opcional)
 */
router.get('/kpis', async (req, res) => {
  try {
    const { periodo, filial_id } = req.query;
    
    // Se não especificar período, usa o mês atual
    const periodoFiltro = periodo || new Date().toISOString().slice(0, 7);
    
    let query = `
      SELECT 
        periodo,
        receita_total,
        lucro_liquido,
        margem_liquida,
        ticket_medio,
        total_pedidos,
        total_clientes,
        criado_em
      FROM kpis_consolidados
      WHERE TO_CHAR(periodo, 'YYYY-MM') = $1
    `;
    
    const params = [periodoFiltro];
    
    // Se especificar filial, filtrar por ela
    if (filial_id) {
      query += ` AND integracao_id = $2`;
      params.push(filial_id);
    }
    
    query += ` ORDER BY periodo DESC LIMIT 1`;
    
    const result = await poolAnalitico.query(query, params);
    
    if (result.rows.length === 0) {
      return res.json({
        periodo: periodoFiltro,
        receita_total: 0,
        lucro_liquido: 0,
        margem_liquida: 0,
        ticket_medio: 0,
        total_pedidos: 0,
        total_clientes: 0,
        variacao_receita: 0,
        variacao_lucro: 0
      });
    }
    
    const kpiAtual = result.rows[0];
    
    // Buscar KPI do mês anterior para calcular variações
    const [ano, mes] = periodoFiltro.split('-');
    const mesAnterior = mes === '01' ? '12' : String(parseInt(mes) - 1).padStart(2, '0');
    const anoAnterior = mes === '01' ? String(parseInt(ano) - 1) : ano;
    const periodoAnterior = `${anoAnterior}-${mesAnterior}`;
    
    const queryAnterior = `
      SELECT receita_total, lucro_liquido
      FROM kpis_consolidados
      WHERE TO_CHAR(periodo, 'YYYY-MM') = $1
      ${filial_id ? 'AND integracao_id = $2' : ''}
      ORDER BY periodo DESC LIMIT 1
    `;
    
    const paramsAnterior = filial_id ? [periodoAnterior, filial_id] : [periodoAnterior];
    const resultAnterior = await poolAnalitico.query(queryAnterior, paramsAnterior);
    
    let variacaoReceita = 0;
    let variacaoLucro = 0;
    
    if (resultAnterior.rows.length > 0) {
      const kpiAnterior = resultAnterior.rows[0];
      
      if (kpiAnterior.receita_total > 0) {
        variacaoReceita = ((kpiAtual.receita_total - kpiAnterior.receita_total) / kpiAnterior.receita_total * 100).toFixed(2);
      }
      
      if (kpiAnterior.lucro_liquido > 0) {
        variacaoLucro = ((kpiAtual.lucro_liquido - kpiAnterior.lucro_liquido) / kpiAnterior.lucro_liquido * 100).toFixed(2);
      }
    }
    
    res.json({
      periodo: periodoFiltro,
      receita_total: parseFloat(kpiAtual.receita_total),
      lucro_liquido: parseFloat(kpiAtual.lucro_liquido),
      margem_liquida: parseFloat(kpiAtual.margem_liquida),
      ticket_medio: parseFloat(kpiAtual.ticket_medio),
      total_pedidos: kpiAtual.total_pedidos,
      total_clientes: kpiAtual.total_clientes,
      variacao_receita: parseFloat(variacaoReceita),
      variacao_lucro: parseFloat(variacaoLucro)
    });
    
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
    res.status(500).json({ error: 'Erro ao buscar KPIs' });
  }
});

/**
 * GET /api/dashboard/vendas-por-filial
 * Retorna vendas agrupadas por filial
 * Query params: data_inicio, data_fim
 */
router.get('/vendas-por-filial', async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    // Se não especificar datas, usa o mês atual
    const hoje = new Date();
    const inicioMes = data_inicio || new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const fimMes = data_fim || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const query = `
      SELECT 
        v.integracao_id,
        i.nome as nome_filial,
        i.filial,
        SUM(v.total_vendas) as total_vendas,
        SUM(v.total_pedidos) as total_pedidos,
        AVG(v.ticket_medio) as ticket_medio
      FROM vendas_por_periodo v
      INNER JOIN dblink(
        'dbname=oracullo_gestao user=oracullo_user password=oracullo123',
        'SELECT id, nome, filial FROM integracoes'
      ) AS i(id integer, nome text, filial text)
      ON v.integracao_id = i.id
      WHERE v.periodo BETWEEN $1 AND $2
      GROUP BY v.integracao_id, i.nome, i.filial
      ORDER BY total_vendas DESC
    `;
    
    const result = await poolAnalitico.query(query, [inicioMes, fimMes]);
    
    const totalGeral = result.rows.reduce((sum, row) => sum + parseFloat(row.total_vendas), 0);
    
    res.json({
      periodo: {
        inicio: inicioMes,
        fim: fimMes
      },
      filiais: result.rows.map(row => ({
        integracao_id: row.integracao_id,
        nome: row.nome_filial,
        filial: row.filial,
        total_vendas: parseFloat(row.total_vendas),
        total_pedidos: row.total_pedidos,
        ticket_medio: parseFloat(row.ticket_medio)
      })),
      total_geral: totalGeral
    });
    
  } catch (error) {
    console.error('Erro ao buscar vendas por filial:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas por filial' });
  }
});

/**
 * GET /api/dashboard/stats
 * Retorna estatísticas gerais do sistema
 */
router.get('/stats', async (req, res) => {
  try {
    // Total de clientes no DB Transacional
    const clientesResult = await poolTransacional.query(
      'SELECT COUNT(*) as total FROM clientes WHERE ativo = true'
    );
    
    // Total de clientes unificados no DB Analítico
    const unificadosResult = await poolAnalitico.query(
      'SELECT COUNT(*) as total FROM clientes_unificados'
    );
    
    // Clientes em múltiplas filiais
    const multiplasResult = await poolAnalitico.query(
      'SELECT COUNT(*) as total FROM clientes_unificados WHERE total_registros > 1'
    );
    
    // Total de produtos
    const produtosResult = await poolTransacional.query(
      'SELECT COUNT(*) as total FROM produtos WHERE ativo = true'
    );
    
    // Total de integrações
    const integracoesResult = await poolGestao.query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'conectado\') as ativas FROM integracoes'
    );
    
    // Última sincronização
    const ultimaSyncResult = await poolGestao.query(
      'SELECT MAX(ultima_sincronizacao) as ultima FROM integracoes WHERE ultima_sincronizacao IS NOT NULL'
    );
    
    res.json({
      total_clientes: parseInt(clientesResult.rows[0].total),
      total_clientes_unificados: parseInt(unificadosResult.rows[0].total),
      clientes_multiplas_filiais: parseInt(multiplasResult.rows[0].total),
      total_produtos: parseInt(produtosResult.rows[0].total),
      total_integracoes: parseInt(integracoesResult.rows[0].total),
      integracoes_ativas: parseInt(integracoesResult.rows[0].ativas),
      ultima_sincronizacao: ultimaSyncResult.rows[0].ultima
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * GET /api/dashboard/vendas-timeline
 * Retorna evolução de vendas ao longo do tempo
 * Query params: meses (quantidade de meses, padrão 12), filial_id (opcional)
 */
router.get('/vendas-timeline', async (req, res) => {
  try {
    const { meses = 12, filial_id } = req.query;
    
    let query = `
      SELECT 
        TO_CHAR(periodo, 'YYYY-MM') as mes,
        SUM(total_vendas) as total_vendas,
        SUM(total_pedidos) as total_pedidos,
        AVG(ticket_medio) as ticket_medio
      FROM vendas_por_periodo
      WHERE periodo >= CURRENT_DATE - INTERVAL '${parseInt(meses)} months'
    `;
    
    const params = [];
    
    if (filial_id) {
      query += ` AND integracao_id = $1`;
      params.push(filial_id);
    }
    
    query += `
      GROUP BY TO_CHAR(periodo, 'YYYY-MM')
      ORDER BY mes ASC
    `;
    
    const result = await poolAnalitico.query(query, params);
    
    res.json({
      meses: parseInt(meses),
      filial_id: filial_id || null,
      timeline: result.rows.map(row => ({
        mes: row.mes,
        total_vendas: parseFloat(row.total_vendas),
        total_pedidos: row.total_pedidos,
        ticket_medio: parseFloat(row.ticket_medio)
      }))
    });
    
  } catch (error) {
    console.error('Erro ao buscar timeline de vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar timeline de vendas' });
  }
});

/**
 * GET /api/dashboard/top-clientes
 * Retorna top clientes por volume de compras
 * Query params: limite (padrão 10), periodo (YYYY-MM)
 */
router.get('/top-clientes', async (req, res) => {
  try {
    const { limite = 10, periodo } = req.query;
    
    // Por enquanto retorna clientes unificados ordenados por total de registros
    // Quando tivermos dados de vendas por cliente, ajustar query
    const query = `
      SELECT 
        id,
        cpf_cnpj,
        nome_razao_social,
        nome_fantasia,
        cidade,
        estado,
        total_registros as filiais_count
      FROM clientes_unificados
      ORDER BY total_registros DESC, nome_razao_social ASC
      LIMIT $1
    `;
    
    const result = await poolAnalitico.query(query, [parseInt(limite)]);
    
    res.json({
      limite: parseInt(limite),
      periodo: periodo || 'todos',
      clientes: result.rows.map(row => ({
        id: row.id,
        cpf_cnpj: row.cpf_cnpj,
        nome: row.nome_razao_social,
        nome_fantasia: row.nome_fantasia,
        cidade: row.cidade,
        estado: row.estado,
        filiais_count: row.filiais_count
      }))
    });
    
  } catch (error) {
    console.error('Erro ao buscar top clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar top clientes' });
  }
});

export default router;
