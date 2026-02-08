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

    // Mapear tipo para o método e endpoint da API OMIE
    const apiConfig = {
      'clientes': {
        call: 'ListarClientes',
        endpoint: 'geral/clientes/'
      },
      'produtos': {
        call: 'ListarProdutos',
        endpoint: 'geral/produtos/'
      },
      'pedidos': {
        call: 'ListarPedidos',
        endpoint: 'produtos/pedido/'
      }
    };

    const config = apiConfig[tipo];

    console.log(`[OMIE] Sincronizando ${tipo} com método ${config.call}`);

    // Preparar requisição para API OMIE
    const requestBody = {
      call: config.call,
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
    const response = await axios.post(api_url + config.endpoint, requestBody, {
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
        // Salvar registros nas tabelas
        for (const registro of registros) {
          if (tipo === 'clientes') {
            await query(
              `INSERT INTO clientes (integracao_id, external_id, nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep, data_json)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (integracao_id, external_id) 
               DO UPDATE SET nome = $3, email = $4, telefone = $5, cpf_cnpj = $6, endereco = $7, cidade = $8, estado = $9, cep = $10, data_json = $11, updated_at = CURRENT_TIMESTAMP`,
              [
                req.body.integracaoId,
                registro.codigo_cliente_omie || registro.codigo_cliente,
                registro.razao_social || registro.nome_fantasia,
                registro.email,
                registro.telefone1_numero,
                registro.cnpj_cpf,
                registro.endereco,
                registro.cidade,
                registro.estado,
                registro.cep,
                JSON.stringify(registro)
              ]
            );
          } else if (tipo === 'produtos') {
            await query(
              `INSERT INTO produtos (integracao_id, external_id, codigo, nome, descricao, preco, estoque, unidade, categoria, ativo, data_json)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (integracao_id, external_id)
               DO UPDATE SET codigo = $3, nome = $4, descricao = $5, preco = $6, estoque = $7, unidade = $8, categoria = $9, ativo = $10, data_json = $11, updated_at = CURRENT_TIMESTAMP`,
              [
                req.body.integracaoId,
                registro.codigo_produto,
                registro.codigo,
                registro.descricao,
                registro.descricao_detalhada,
                registro.valor_unitario,
                registro.quantidade_estoque,
                registro.unidade,
                registro.nome_familia,
                registro.inativo === 'N',
                JSON.stringify(registro)
              ]
            );
          }
        }

        console.log(`[OMIE] ${registros.length} ${tipo} salvos no banco`);

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
