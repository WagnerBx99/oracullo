import { poolGestao } from '../config/databases.js';
import bcrypt from 'bcryptjs';

export class Usuario {
  // Criar novo usuário
  static async create(data) {
    const { nome, email, senha } = data;
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const result = await poolGestao.query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, ativo, created_at`,
      [nome, email, senhaHash]
    );
    
    return result.rows[0];
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    const result = await poolGestao.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Buscar usuário por ID
  static async findById(id) {
    const result = await poolGestao.query(
      'SELECT id, nome, email, ativo, ultimo_login, created_at FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Verificar senha
  static async verifyPassword(senha, senhaHash) {
    return await bcrypt.compare(senha, senhaHash);
  }

  // Atualizar último login
  static async updateLastLogin(id) {
    await poolGestao.query(
      'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  // Salvar refresh token
  static async saveRefreshToken(usuarioId, token, expiresAt) {
    await poolGestao.query(
      `INSERT INTO refresh_tokens (usuario_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [usuarioId, token, expiresAt]
    );
  }

  // Verificar se refresh token é válido
  static async verifyRefreshToken(token) {
    const result = await poolGestao.query(
      `SELECT rt.*, u.id as usuario_id, u.nome, u.email 
       FROM refresh_tokens rt
       JOIN usuarios u ON rt.usuario_id = u.id
       WHERE rt.token = $1 
       AND rt.revoked = false 
       AND rt.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    return result.rows[0];
  }

  // Revogar refresh token
  static async revokeRefreshToken(token) {
    await poolGestao.query(
      'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
      [token]
    );
  }

  // Revogar todos os tokens de um usuário
  static async revokeAllUserTokens(usuarioId) {
    await poolGestao.query(
      'UPDATE refresh_tokens SET revoked = true WHERE usuario_id = $1',
      [usuarioId]
    );
  }
}
