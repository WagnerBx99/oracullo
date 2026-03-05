import express from 'express';
const router = express.Router();
import { poolGestao } from '../config/databases.js';

// GET /api/perfis - Listar todos os perfis
router.get('/', async (req, res) => {
  try {
    const result = await poolGestao.query(`
      SELECT 
        p.id,
        p.nome,
        p.descricao,
        p.cor,
        p.created_at,
        p.updated_at,
        COUNT(u.id) as total_usuarios
      FROM perfis p
      LEFT JOIN usuarios u ON u.perfil_id = p.id
      GROUP BY p.id, p.nome, p.descricao, p.cor, p.created_at, p.updated_at
      ORDER BY p.id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('[Perfis] Erro ao listar:', error);
    res.status(500).json({ 
      error: 'Erro ao listar perfis',
      details: error.message 
    });
  }
});

// GET /api/perfis/:id - Buscar perfil por ID com permissões
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar perfil
    const perfilResult = await poolGestao.query(`
      SELECT 
        id,
        nome,
        descricao,
        cor,
        created_at,
        updated_at
      FROM perfis
      WHERE id = $1
    `, [id]);

    if (perfilResult.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const perfil = perfilResult.rows[0];

    // Buscar permissões do perfil
    const permissoesResult = await poolGestao.query(`
      SELECT 
        pp.permissao_id,
        perm.modulo,
        perm.chave,
        perm.descricao
      FROM perfil_permissoes pp
      JOIN permissoes perm ON pp.permissao_id = perm.id
      WHERE pp.perfil_id = $1
      ORDER BY perm.modulo, perm.chave
    `, [id]);

    perfil.permissoes = permissoesResult.rows;

    res.json(perfil);
  } catch (error) {
    console.error('[Perfis] Erro ao buscar:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar perfil',
      details: error.message 
    });
  }
});

// GET /api/permissoes - Listar todas as permissões disponíveis
router.get('/sistema/permissoes', async (req, res) => {
  try {
    const result = await poolGestao.query(`
      SELECT 
        id,
        modulo,
        chave,
        descricao
      FROM permissoes
      ORDER BY modulo, chave
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('[Permissões] Erro ao listar:', error);
    res.status(500).json({ 
      error: 'Erro ao listar permissões',
      details: error.message 
    });
  }
});

// POST /api/perfis - Criar novo perfil
router.post('/', async (req, res) => {
  const client = await poolGestao.connect();
  
  try {
    const { nome, descricao, cor, permissoes = [] } = req.body;

    // Validações
    if (!nome) {
      return res.status(400).json({ error: 'Nome do perfil é obrigatório' });
    }

    await client.query('BEGIN');

    // Inserir perfil
    const perfilResult = await client.query(`
      INSERT INTO perfis (nome, descricao, cor)
      VALUES ($1, $2, $3)
      RETURNING id, nome, descricao, cor, created_at
    `, [nome, descricao, cor]);

    const perfil = perfilResult.rows[0];

    // Inserir permissões do perfil
    if (permissoes.length > 0) {
      const permissoesValues = permissoes.map((permissaoId, index) => 
        `($1, $${index + 2})`
      ).join(', ');

      await client.query(`
        INSERT INTO perfil_permissoes (perfil_id, permissao_id)
        VALUES ${permissoesValues}
      `, [perfil.id, ...permissoes]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Perfil criado com sucesso',
      perfil: perfil
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Perfis] Erro ao criar:', error);
    res.status(500).json({ 
      error: 'Erro ao criar perfil',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// PUT /api/perfis/:id - Atualizar perfil e permissões
router.put('/:id', async (req, res) => {
  const client = await poolGestao.connect();
  
  try {
    const { id } = req.params;
    const { nome, descricao, cor, permissoes } = req.body;

    // Verificar se perfil existe
    const perfilExists = await client.query(
      'SELECT id FROM perfis WHERE id = $1',
      [id]
    );

    if (perfilExists.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    await client.query('BEGIN');

    // Atualizar perfil
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nome !== undefined) {
      updates.push(`nome = $${paramCount++}`);
      values.push(nome);
    }
    if (descricao !== undefined) {
      updates.push(`descricao = $${paramCount++}`);
      values.push(descricao);
    }
    if (cor !== undefined) {
      updates.push(`cor = $${paramCount++}`);
      values.push(cor);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      await client.query(`
        UPDATE perfis 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
      `, values);
    }

    // Atualizar permissões se fornecidas
    if (permissoes !== undefined) {
      // Remover permissões antigas
      await client.query(
        'DELETE FROM perfil_permissoes WHERE perfil_id = $1',
        [id]
      );

      // Inserir novas permissões
      if (permissoes.length > 0) {
        const permissoesValues = permissoes.map((permissaoId, index) => 
          `($1, $${index + 2})`
        ).join(', ');

        await client.query(`
          INSERT INTO perfil_permissoes (perfil_id, permissao_id)
          VALUES ${permissoesValues}
        `, [id, ...permissoes]);
      }
    }

    await client.query('COMMIT');

    // Buscar perfil atualizado
    const perfilResult = await client.query(`
      SELECT id, nome, descricao, cor, updated_at
      FROM perfis
      WHERE id = $1
    `, [id]);

    res.json({
      message: 'Perfil atualizado com sucesso',
      perfil: perfilResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Perfis] Erro ao atualizar:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar perfil',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// DELETE /api/perfis/:id - Deletar perfil
router.delete('/:id', async (req, res) => {
  const client = await poolGestao.connect();
  
  try {
    const { id } = req.params;

    // Verificar se perfil existe
    const perfilExists = await client.query(
      'SELECT id FROM perfis WHERE id = $1',
      [id]
    );

    if (perfilExists.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Verificar se há usuários com este perfil
    const usuariosComPerfil = await client.query(
      'SELECT COUNT(*) as total FROM usuarios WHERE perfil_id = $1',
      [id]
    );

    if (parseInt(usuariosComPerfil.rows[0].total) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar perfil com usuários associados',
        total_usuarios: usuariosComPerfil.rows[0].total
      });
    }

    await client.query('BEGIN');

    // Deletar permissões do perfil
    await client.query(
      'DELETE FROM perfil_permissoes WHERE perfil_id = $1',
      [id]
    );

    // Deletar perfil
    await client.query('DELETE FROM perfis WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Perfil deletado com sucesso' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Perfis] Erro ao deletar:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar perfil',
      details: error.message 
    });
  } finally {
    client.release();
  }
});

export default router;
