import express from 'express';
import { Integracao } from '../models/Integracao.js';

const router = express.Router();

// Listar todas as integrações
router.get('/', async (req, res) => {
  try {
    const integracoes = await Integracao.findAll();
    res.json(integracoes);
  } catch (error) {
    console.error('[Integrações] Erro ao listar:', error);
    res.status(500).json({ error: 'Erro ao listar integrações' });
  }
});

// Buscar integração por ID
router.get('/:id', async (req, res) => {
  try {
    const integracao = await Integracao.findById(req.params.id);
    
    if (!integracao) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }
    
    res.json(integracao);
  } catch (error) {
    console.error('[Integrações] Erro ao buscar:', error);
    res.status(500).json({ error: 'Erro ao buscar integração' });
  }
});

// Criar nova integração
router.post('/', async (req, res) => {
  try {
    const { nome, tipo, sistema, api_url, api_key, company_token } = req.body;

    // Validar campos obrigatórios
    if (!nome || !tipo || !sistema || !api_url || !api_key) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, tipo, sistema, api_url, api_key'
      });
    }

    const integracao = await Integracao.create({
      nome,
      tipo,
      sistema,
      api_url,
      api_key,
      company_token
    });

    res.status(201).json(integracao);
  } catch (error) {
    console.error('[Integrações] Erro ao criar:', error);
    res.status(500).json({ error: 'Erro ao criar integração' });
  }
});

// Atualizar integração
router.put('/:id', async (req, res) => {
  try {
    const integracao = await Integracao.update(req.params.id, req.body);
    
    if (!integracao) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }
    
    res.json(integracao);
  } catch (error) {
    console.error('[Integrações] Erro ao atualizar:', error);
    res.status(500).json({ error: 'Erro ao atualizar integração' });
  }
});

// Deletar integração
router.delete('/:id', async (req, res) => {
  try {
    await Integracao.delete(req.params.id);
    res.json({ success: true, message: 'Integração deletada' });
  } catch (error) {
    console.error('[Integrações] Erro ao deletar:', error);
    res.status(500).json({ error: 'Erro ao deletar integração' });
  }
});

export default router;
