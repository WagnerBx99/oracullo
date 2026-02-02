import express from 'express';
import axios from 'axios';
import { Integracao } from '../models/Integracao.js';
import { query } from '../database/db.js';

const router = express.Router();

// Endpoint para sincronizar dados do MERCOS
router.post('/sync', async (req, res) => {
  try {
    const { api_url, api_key, company_token, tipo } = req.body;

    // Validar parâmetros
    if (!api_url || !api_key || !company_token || !tipo) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: api_url, api_key, company_token, tipo'
      });
    }

    if (!['clientes', 'produtos', 'pedidos'].includes(tipo)) {
      return res.status(400).json({
        error: 'Tipo inválido. Use: clientes, produtos ou pedidos'
      });
    }

    // Configurar headers para API do MERCOS
    const headers = {
      'Content-Type': 'application/json',
      'token': api_key,
      'companyToken': company_token
    };

    // Definir endpoint
    const endpoint = `${api_url}/${tipo}`;

    console.log(`[MERCOS] Sincronizando ${tipo} de ${endpoint}`);

    // Fazer requisição para API do MERCOS
    const response = await axios.get(endpoint, { 
      headers,
      timeout: 30000 // 30 segundos
    });

    const data = response.data;

    console.log(`[MERCOS] Sucesso: ${data.length || 0} ${tipo} obtidos`);

    // Salvar dados no banco (se tiver integracaoId)
    if (req.body.integracaoId) {
      try {
        // Atualizar status da integração
        await Integracao.update(req.body.integracaoId, {
          status: 'conectado',
          ultima_sincronizacao: new Date()
        });

        // Registrar log de sincronização
        await query(
          `INSERT INTO logs_sincronizacao (integracao_id, tipo, status, total_registros, mensagem)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.body.integracaoId, tipo, 'sucesso', data.length || 0, `Sincronização de ${tipo} concluída com sucesso`]
        );
      } catch (dbError) {
        console.error('[MERCOS] Erro ao salvar no banco:', dbError.message);
      }
    }

    return res.json({
      success: true,
      data: data,
      total: data.length || 0,
      tipo: tipo
    });

  } catch (error) {
    console.error('[MERCOS] Erro na sincronização:', error.message);

    // Tratar erro de throttling (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return res.status(429).json({
        error: 'Rate limit excedido',
        retry_after: retryAfter,
        message: `Tente novamente em ${retryAfter} segundos`
      });
    }

    // Tratar erro de autenticação (401)
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Autenticação falhou',
        message: 'Verifique se o API Key e Company Token estão corretos'
      });
    }

    // Erro genérico
    return res.status(error.response?.status || 500).json({
      error: 'Erro ao sincronizar com MERCOS',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Endpoint para testar conexão
router.post('/test', async (req, res) => {
  try {
    const { api_url, api_key, company_token } = req.body;

    if (!api_url || !api_key || !company_token) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: api_url, api_key, company_token'
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'token': api_key,
      'companyToken': company_token
    };

    // Testar endpoint de status
    const response = await axios.get(`${api_url}/token_auth_status`, {
      headers,
      timeout: 10000
    });

    return res.json({
      success: true,
      message: 'Conexão estabelecida com sucesso',
      status: response.status
    });

  } catch (error) {
    console.error('[MERCOS] Erro no teste de conexão:', error.message);

    return res.status(error.response?.status || 500).json({
      success: false,
      error: 'Falha na conexão',
      message: error.message
    });
  }
});

export default router;
