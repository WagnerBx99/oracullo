import express from 'express';
import axios from 'axios';
import { Integracao } from '../models/Integracao.js';
import { query } from '../database/db.js';

const router = express.Router();

// Endpoint para sincronizar dados da OMIE
router.post('/sync', async (req, res) => {
  try {
    const { api_url, api_key, app_secret, tipo } = req.body;

    // Validar parâmetros
    if (!api_url || !api_key || !app_secret || !tipo) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: api_url, api_key, app_secret, tipo'
      });
    }

    if (!['clientes', 'produtos', 'pedidos'].includes(tipo)) {
      return res.status(400).json({
        error: 'Tipo inválido. Use: clientes, produtos ou pedidos'
      });
    }

    // Mapear tipo para o método da API OMIE
    const callMap = {
      'clientes': 'ListarClientes',
      'produtos': 'ListarProdutos',
      'pedidos': 'ListarPedidos'
    };

    const call = callMap[tipo];

    console.log(`[OMIE] Sincronizando ${tipo} com método ${call}`);

    // Preparar requisição para API OMIE
    const requestBody = {
      call: call,
      app_key: api_key,
      app_secret: app_secret,
      param: [
        {
          pagina: 1,
          registros_por_pagina: 100,
          apenas_importado_api: 'N'
        }
      ]
    };

    // Fazer requisição para API da OMIE
    const response = await axios.post(api_url + 'geral/clientes/', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });

    const data = response.data;
    const registros = data.clientes_cadastro || data.produto_servico_cadastro || data.pedido_venda_produto || [];

    console.log(`[OMIE] Sucesso: ${registros.length} ${tipo} obtidos`);

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
          [req.body.integracaoId, tipo, 'sucesso', registros.length, `Sincronização de ${tipo} concluída com sucesso`]
        );
      } catch (dbError) {
        console.error('[OMIE] Erro ao salvar no banco:', dbError.message);
      }
    }

    return res.json({
      success: true,
      data: registros,
      total: registros.length,
      tipo: tipo
    });

  } catch (error) {
    console.error('[OMIE] Erro na sincronização:', error.message);

    // Tratar erro de rate limit (429)
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit excedido',
        message: 'Aguarde antes de fazer nova requisição'
      });
    }

    // Tratar erro de autenticação (401/403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(401).json({
        error: 'Autenticação falhou',
        message: 'Verifique se o App Key e App Secret estão corretos'
      });
    }

    // Erro genérico
    return res.status(error.response?.status || 500).json({
      error: 'Erro ao sincronizar com OMIE',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Endpoint para testar conexão
router.post('/test', async (req, res) => {
  try {
    const { api_url, api_key, app_secret } = req.body;

    if (!api_url || !api_key || !app_secret) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: api_url, api_key, app_secret'
      });
    }

    // Testar com uma requisição simples de listagem
    const requestBody = {
      call: 'ListarClientes',
      app_key: api_key,
      app_secret: app_secret,
      param: [
        {
          pagina: 1,
          registros_por_pagina: 1
        }
      ]
    };

    const response = await axios.post(api_url + 'geral/clientes/', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return res.json({
      success: true,
      message: 'Conexão estabelecida com sucesso',
      status: response.status
    });

  } catch (error) {
    console.error('[OMIE] Erro no teste de conexão:', error.message);

    return res.status(error.response?.status || 500).json({
      success: false,
      error: 'Falha na conexão',
      message: error.message
    });
  }
});

export default router;
