import { query } from '../database/db.js';

export class Integracao {
  // Criar nova integração
  static async create(data) {
    const { nome, tipo, sistema, api_url, api_key, company_token } = data;
    
    const result = await query(
      `INSERT INTO integracoes (nome, tipo, sistema, api_url, api_key, company_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nome, tipo, sistema, api_url, api_key, company_token]
    );
    
    return result.rows[0];
  }

  // Buscar todas as integrações
  static async findAll() {
    const result = await query('SELECT * FROM integracoes ORDER BY created_at DESC');
    return result.rows;
  }

  // Buscar integração por ID
  static async findById(id) {
    const result = await query('SELECT * FROM integracoes WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Atualizar integração
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    values.push(id);

    const result = await query(
      `UPDATE integracoes 
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Deletar integração
  static async delete(id) {
    await query('DELETE FROM integracoes WHERE id = $1', [id]);
    return { success: true };
  }

  // Buscar por sistema
  static async findBySystem(sistema) {
    const result = await query(
      'SELECT * FROM integracoes WHERE sistema = $1',
      [sistema]
    );
    return result.rows;
  }
}
