import express from 'express';
import { poolTransacional, poolGestao } from '../config/databases.js';

const router = express.Router();

// GET /api/operacional/kpis - KPIs operacionais
router.get('/kpis', async (req, res) => {
  try {
    const { periodo = new Date().getFullYear() } = req.query;
    
    console.log('[OPERACIONAL] Buscando KPIs para período:', periodo);

    // Eficiência Geral (% pedidos processados com sucesso)
    const eficiencia = await poolTransacional.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status NOT IN ('cancelado', 'rejeitado')) AS processados,
        COUNT(*) AS total
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
    `, [parseInt(periodo)]);

    const eficienciaGeral = eficiencia.rows[0].total > 0
      ? (eficiencia.rows[0].processados / eficiencia.rows[0].total * 100).toFixed(1)
      : 0;

    // Prazo Médio (tempo médio de processamento em dias - estimado)
    // Como não temos data_entrega, usamos 3.2 dias como padrão baseado nos dados mockados
    const prazoMedio = 3.2;

    // Taxa de Entrega (% pedidos com status diferente de cancelado/rejeitado)
    const taxaEntrega = eficienciaGeral;

    // Não Conformidades (% pedidos cancelados/rejeitados)
    const naoConformidades = await poolTransacional.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('cancelado', 'rejeitado')) AS nao_conforme,
        COUNT(*) AS total
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
    `, [parseInt(periodo)]);

    const taxaNaoConformidade = naoConformidades.rows[0].total > 0
      ? (naoConformidades.rows[0].nao_conforme / naoConformidades.rows[0].total * 100).toFixed(1)
      : 0;

    const resultado = {
      eficiencia_geral: parseFloat(eficienciaGeral),
      prazo_medio: parseFloat(prazoMedio),
      taxa_entrega: parseFloat(taxaEntrega),
      nao_conformidades: parseFloat(taxaNaoConformidade)
    };

    console.log('[OPERACIONAL] KPIs calculados:', resultado);
    res.json(resultado);

  } catch (error) {
    console.error('[OPERACIONAL] Erro ao buscar KPIs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/operacional/producao-semanal - Produção por dia da semana
router.get('/producao-semanal', async (req, res) => {
  try {
    const { periodo = new Date().getFullYear() } = req.query;
    
    console.log('[OPERACIONAL] Buscando produção semanal para:', periodo);

    const producao = await poolTransacional.query(`
      SELECT 
        CASE EXTRACT(DOW FROM data_pedido)
          WHEN 0 THEN 'Dom'
          WHEN 1 THEN 'Seg'
          WHEN 2 THEN 'Ter'
          WHEN 3 THEN 'Qua'
          WHEN 4 THEN 'Qui'
          WHEN 5 THEN 'Sex'
          WHEN 6 THEN 'Sáb'
        END AS dia,
        EXTRACT(DOW FROM data_pedido) AS dia_num,
        COUNT(*) AS realizado
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
        AND status NOT IN ('cancelado', 'rejeitado')
      GROUP BY EXTRACT(DOW FROM data_pedido)
      ORDER BY dia_num
    `, [parseInt(periodo)]);

    // Calcula média para usar como "planejado"
    const totalPedidos = producao.rows.reduce((sum, row) => sum + parseInt(row.realizado), 0);
    const mediaDiaria = producao.rows.length > 0 ? Math.round(totalPedidos / producao.rows.length) : 0;

    const resultado = producao.rows.map(row => ({
      dia: row.dia,
      planejado: mediaDiaria,
      realizado: parseInt(row.realizado),
      eficiencia: mediaDiaria > 0 ? Math.round((row.realizado / mediaDiaria) * 100) : 100
    }));

    console.log('[OPERACIONAL] Produção semanal:', resultado.length, 'dias');
    res.json(resultado);

  } catch (error) {
    console.error('[OPERACIONAL] Erro ao buscar produção semanal:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/operacional/entregas-periodo - Pedidos por período do dia
router.get('/entregas-periodo', async (req, res) => {
  try {
    const { periodo = new Date().getFullYear() } = req.query;
    
    console.log('[OPERACIONAL] Buscando pedidos por período para:', periodo);

    const entregas = await poolTransacional.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(HOUR FROM data_pedido) BETWEEN 0 AND 5 THEN '00-06h'
          WHEN EXTRACT(HOUR FROM data_pedido) BETWEEN 6 AND 11 THEN '06-12h'
          WHEN EXTRACT(HOUR FROM data_pedido) BETWEEN 12 AND 17 THEN '12-18h'
          ELSE '18-24h'
        END AS periodo,
        COUNT(*) AS entregas,
        COUNT(*) FILTER (WHERE status IN ('cancelado', 'rejeitado')) AS atraso
      FROM pedidos
      WHERE EXTRACT(YEAR FROM data_pedido) = $1
      GROUP BY 
        CASE 
          WHEN EXTRACT(HOUR FROM data_pedido) BETWEEN 0 AND 5 THEN '00-06h'
          WHEN EXTRACT(HOUR FROM data_pedido) BETWEEN 6 AND 11 THEN '06-12h'
          WHEN EXTRACT(HOUR FROM data_pedido) BETWEEN 12 AND 17 THEN '12-18h'
          ELSE '18-24h'
        END
      ORDER BY periodo
    `, [parseInt(periodo)]);

    // Garantir que todos os períodos existam
    const periodos = ['00-06h', '06-12h', '12-18h', '18-24h'];
    const resultado = periodos.map(p => {
      const found = entregas.rows.find(row => row.periodo === p);
      return {
        periodo: p,
        entregas: found ? parseInt(found.entregas) : 0,
        atraso: found ? parseInt(found.atraso || 0) : 0
      };
    });

    console.log('[OPERACIONAL] Pedidos por período:', resultado.length, 'períodos');
    res.json(resultado);

  } catch (error) {
    console.error('[OPERACIONAL] Erro ao buscar pedidos por período:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/operacional/estoque - Níveis de estoque por categoria
router.get('/estoque', async (req, res) => {
  try {
    console.log('[OPERACIONAL] Buscando níveis de estoque');

    const estoque = await poolTransacional.query(`
      SELECT 
        categoria,
        SUM(estoque) AS nivel,
        COUNT(*) AS total_produtos
      FROM produtos
      WHERE categoria IS NOT NULL
        AND estoque > 0
      GROUP BY categoria
      ORDER BY nivel DESC
      LIMIT 10
    `);

    const resultado = estoque.rows.map(row => {
      const nivel = parseInt(row.nivel);
      return {
        categoria: row.categoria,
        nivel: nivel,
        minimo: Math.round(nivel * 0.7), // 70% como mínimo
        maximo: Math.round(nivel * 1.3)  // 130% como máximo
      };
    });

    console.log('[OPERACIONAL] Estoque por categoria:', resultado.length, 'categorias');
    res.json(resultado);

  } catch (error) {
    console.error('[OPERACIONAL] Erro ao buscar estoque:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
