import express from 'express';
import { dbAnalitico, dbTransacional } from '../config/databases.js';

const router = express.Router();

/**
 * GET /api/clientes/unificados
 * Lista clientes unificados do DB Analítico
 */
router.get('/unificados', async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id,
        cpf_cnpj,
        nome,
        email,
        telefone,
        cidade,
        estado,
        total_filiais,
        filiais_ids,
        primeiro_cadastro,
        ultima_atualizacao
      FROM clientes_unificados
    `;

    const params = [];
    
    if (search) {
      query += ` WHERE nome ILIKE $1 OR cpf_cnpj ILIKE $1 OR email ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY nome LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbAnalitico.query(query, params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) FROM clientes_unificados';
    const countParams = [];
    
    if (search) {
      countQuery += ` WHERE nome ILIKE $1 OR cpf_cnpj ILIKE $1 OR email ILIKE $1`;
      countParams.push(`%${search}%`);
    }

    const countResult = await dbAnalitico.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[CLIENTES] Erro ao listar clientes unificados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar clientes unificados'
    });
  }
});

/**
 * GET /api/clientes/unificados/stats
 * Estatísticas de clientes unificados
 */
router.get('/unificados/stats', async (req, res) => {
  try {
    const stats = await dbAnalitico.query(`
      SELECT 
        COUNT(*) as total_clientes_unificados,
        COUNT(*) FILTER (WHERE total_filiais > 1) as clientes_em_multiplas_filiais,
        SUM(total_filiais) as total_registros_originais,
        AVG(total_filiais) as media_filiais_por_cliente
      FROM clientes_unificados
    `);

    const transacionalCount = await dbTransacional.query('SELECT COUNT(*) FROM clientes');

    res.json({
      success: true,
      data: {
        ...stats.rows[0],
        total_clientes_transacional: parseInt(transacionalCount.rows[0].count),
        clientes_duplicados: parseInt(transacionalCount.rows[0].count) - parseInt(stats.rows[0].total_clientes_unificados)
      }
    });
  } catch (error) {
    console.error('[CLIENTES] Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
});

/**
 * POST /api/clientes/unificar
 * Executa unificação de clientes
 */
router.post('/unificar', async (req, res) => {
  try {
    console.log('[CLIENTES] Iniciando unificação de clientes...');

    // Executar função de unificação
    const result = await dbAnalitico.query('SELECT * FROM unificar_clientes()');
    
    const stats = result.rows[0];

    console.log('[CLIENTES] Unificação concluída:', stats);

    res.json({
      success: true,
      message: 'Clientes unificados com sucesso',
      data: {
        total_clientes_transacional: stats.total_clientes_transacional,
        total_clientes_unificados: stats.total_clientes_unificados,
        clientes_duplicados: stats.clientes_duplicados,
        clientes_em_multiplas_filiais: stats.clientes_em_multiplas_filiais
      }
    });
  } catch (error) {
    console.error('[CLIENTES] Erro ao unificar clientes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao unificar clientes'
    });
  }
});

/**
 * GET /api/clientes/unificados/:id
 * Busca cliente unificado por ID
 */
router.get('/unificados/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbAnalitico.query(`
      SELECT 
        id,
        cpf_cnpj,
        nome,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        total_filiais,
        filiais_ids,
        primeiro_cadastro,
        ultima_atualizacao,
        created_at,
        updated_at
      FROM clientes_unificados
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Buscar registros originais por filial
    const cliente = result.rows[0];
    const registrosPorFilial = await dbTransacional.query(`
      SELECT 
        c.id,
        c.integracao_id,
        i.nome as filial_nome,
        c.nome,
        c.email,
        c.telefone,
        c.cidade,
        c.estado,
        c.created_at,
        c.updated_at
      FROM clientes c
      LEFT JOIN dblink(
        'host=localhost dbname=oracullo_gestao user=oracullo_user password=oracullo123',
        'SELECT id, nome FROM integracoes'
      ) AS i(id INT, nome VARCHAR) ON c.integracao_id = i.id
      WHERE c.cpf_cnpj = $1
      ORDER BY c.created_at
    `, [cliente.cpf_cnpj]);

    res.json({
      success: true,
      data: {
        ...cliente,
        registros_por_filial: registrosPorFilial.rows
      }
    });
  } catch (error) {
    console.error('[CLIENTES] Erro ao buscar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar cliente'
    });
  }
});

export default router;
