import express from 'express';
const router = express.Router();
import { poolGestao } from '../config/databases.js';
import bcrypt from 'bcrypt';

// GET /api/usuarios - Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const result = await poolGestao.query(`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.perfil_id,
        p.nome as perfil_nome,
        p.cor as perfil_cor,
        u.ativo,
        u.ultimo_login,
        u.created_at,
        u.updated_at
      FROM usuarios u
      LEFT JOIN perfis p ON u.perfil_id = p.id
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('[Usuários] Erro ao listar:', error);
    res.status(500).json({ 
      error: 'Erro ao listar usuários',
      details: error.message 
    });
  }
});

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await poolGestao.query(`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.perfil_id,
        p.nome as perfil_nome,
        p.cor as perfil_cor,
        u.ativo,
        u.ultimo_login,
        u.created_at,
        u.updated_at
      FROM usuarios u
      LEFT JOIN perfis p ON u.perfil_id = p.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Usuários] Erro ao buscar:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar usuário',
      details: error.message 
    });
  }
});

// POST /api/usuarios - Criar novo usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, perfil_id, ativo = true } = req.body;

    // Validações
    if (!nome || !email || !senha || !perfil_id) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, email, senha, perfil_id' 
      });
    }

    // Verificar se email já existe
    const emailExists = await poolGestao.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir usuário
    const result = await poolGestao.query(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil_id, ativo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome, email, perfil_id, ativo, created_at
    `, [nome, email, senhaHash, perfil_id, ativo]);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('[Usuários] Erro ao criar:', error);
    res.status(500).json({ 
      error: 'Erro ao criar usuário',
      details: error.message 
    });
  }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, perfil_id, ativo } = req.body;

    // Verificar se usuário existe
    const userExists = await poolGestao.query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se email já existe em outro usuário
    if (email) {
      const emailExists = await poolGestao.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado em outro usuário' });
      }
    }

    // Construir query de atualização dinamicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nome !== undefined) {
      updates.push(`nome = $${paramCount++}`);
      values.push(nome);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (senha !== undefined) {
      const senhaHash = await bcrypt.hash(senha, 10);
      updates.push(`senha_hash = $${paramCount++}`);
      values.push(senhaHash);
    }
    if (perfil_id !== undefined) {
      updates.push(`perfil_id = $${paramCount++}`);
      values.push(perfil_id);
    }
    if (ativo !== undefined) {
      updates.push(`ativo = $${paramCount++}`);
      values.push(ativo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await poolGestao.query(`
      UPDATE usuarios 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, nome, email, perfil_id, ativo, updated_at
    `, values);

    res.json({
      message: 'Usuário atualizado com sucesso',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('[Usuários] Erro ao atualizar:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar usuário',
      details: error.message 
    });
  }
});

// DELETE /api/usuarios/:id - Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const userExists = await poolGestao.query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Deletar usuário
    await poolGestao.query('DELETE FROM usuarios WHERE id = $1', [id]);

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('[Usuários] Erro ao deletar:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar usuário',
      details: error.message 
    });
  }
});

// POST /api/usuarios/convidar - Enviar convite para novo usuário
router.post('/convidar', async (req, res) => {
  try {
    const { nome, email, perfil_id } = req.body;

    // Validações
    if (!nome || !email || !perfil_id) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, email, perfil_id' 
      });
    }

    // Verificar se email já existe
    const emailExists = await poolGestao.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Gerar senha temporária
    const senhaTemporaria = Math.random().toString(36).slice(-8);
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    // Criar usuário com senha temporária
    const result = await poolGestao.query(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil_id, ativo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, nome, email, perfil_id, created_at
    `, [nome, email, senhaHash, perfil_id]);

    // TODO: Enviar email com link de ativação e senha temporária
    // Por enquanto, retornar senha temporária na resposta (apenas para desenvolvimento)

    res.status(201).json({
      message: 'Convite enviado com sucesso',
      usuario: result.rows[0],
      senhaTemporaria: senhaTemporaria, // REMOVER EM PRODUÇÃO
      aviso: 'Em produção, a senha será enviada por email'
    });
  } catch (error) {
    console.error('[Usuários] Erro ao convidar:', error);
    res.status(500).json({ 
      error: 'Erro ao enviar convite',
      details: error.message 
    });
  }
});

export default router;
