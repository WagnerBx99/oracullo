import express from 'express';
import { poolGestao, poolTransacional } from '../config/databases.js';

const router = express.Router();

// GET /api/produtos - Lista todos os produtos com custo e preço
router.get('/', async (req, res) => {
  try {
    // Buscar nomes das integrações (filiais)
    const integracoesResult = await poolGestao.query('SELECT id, nome FROM integracoes');
    const integracoesMap = integracoesResult.rows.reduce((acc, row) => {
      acc[row.id] = row.nome;
      return acc;
    }, {});

    const query = `
      SELECT DISTINCT ON (p.codigo)
        p.id,
        p.integracao_id,
        p.codigo,
        p.nome,
        p.descricao,
        p.preco as preco_venda,
        p.custo,
        p.margem,
        p.categoria,
        p.unidade,
        p.estoque,
        p.ativo,
        COALESCE(p.data_json->>'marca', '-') as marca,
        'Consolidado' as fonte,
        'ERP' as tipo_integracao
      FROM produtos p
      ORDER BY p.codigo, p.id DESC
    `;
    
    const result = await poolTransacional.query(query);
    
    // Calcular margem e mapear filial
    const produtos = result.rows.map(p => ({
      ...p,
      filial: integracoesMap[p.integracao_id] || 'Matriz',
      margem: p.custo && p.preco_venda 
        ? parseFloat(((p.preco_venda - p.custo) / p.preco_venda * 100).toFixed(2))
        : 0
    }));
    
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET /api/produtos/stats - Estatísticas de produtos
router.get('/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT codigo) as total_produtos,
        COUNT(DISTINCT CASE WHEN custo > 0 THEN codigo END) as produtos_com_custo,
        COALESCE(AVG(CASE WHEN custo > 0 THEN custo END), 0) as custo_medio,
        COALESCE(AVG(CASE WHEN preco > 0 THEN preco END), 0) as preco_medio,
        COALESCE(AVG(
          CASE 
            WHEN custo > 0 AND preco > 0 
            THEN ((preco - custo) / preco * 100)
          END
        ), 0) as margem_media
      FROM produtos
      WHERE ativo = true
    `;
    
    const result = await poolTransacional.query(query);
    const stats = result.rows[0];
    
    // Converter para números
    res.json({
      total_produtos: parseInt(stats.total_produtos),
      produtos_com_custo: parseInt(stats.produtos_com_custo),
      custo_medio: parseFloat(stats.custo_medio) || 0,
      preco_medio: parseFloat(stats.preco_medio) || 0,
      margem_media: parseFloat(stats.margem_media) || 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
