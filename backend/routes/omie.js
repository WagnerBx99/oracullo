import express from 'express';
import axios from 'axios';
import { Integracao } from '../models/Integracao.js';
import { poolGestao, poolTransacional } from '../config/databases.js';

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

    // Função para fazer requisição com delay (rate limit)
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchPage = async (pagina) => {
      const params = {
        pagina: pagina,
        registros_por_pagina: 100,
        apenas_importado_api: 'N'
      };
      
      // filtrar_apenas_omiepdv só existe para produtos
      if (tipo === 'produtos') {
        params.filtrar_apenas_omiepdv = 'N';
      }
      
      const requestBody = {
        call: config.call,
        app_key: api_key,
        app_secret: app_secret,
        param: [params]
      };

      const response = await axios.post(api_url + config.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    };

    // Buscar primeira página para saber total de páginas
    console.log(`[OMIE] Buscando página 1...`);
    const primeiraResposta = await fetchPage(1);
    
    let todosRegistros = primeiraResposta.clientes_cadastro || primeiraResposta.produto_servico_cadastro || primeiraResposta.pedido_venda_produto || [];
    const totalPaginas = primeiraResposta.total_de_paginas || 1;
    const totalRegistros = primeiraResposta.total_de_registros || todosRegistros.length;

    console.log(`[OMIE] Total de registros: ${totalRegistros}, Total de páginas: ${totalPaginas}`);

    // Buscar demais páginas com delay de 300ms entre cada requisição (respeita rate limit)
    for (let pagina = 2; pagina <= totalPaginas; pagina++) {
      await sleep(300); // Delay de 300ms = ~3 requisições por segundo (bem abaixo do limite de 4/s)
      
      console.log(`[OMIE] Buscando página ${pagina}/${totalPaginas}...`);
      
      try {
        const resposta = await fetchPage(pagina);
        const registrosPagina = resposta.clientes_cadastro || resposta.produto_servico_cadastro || resposta.pedido_venda_produto || [];
        todosRegistros = todosRegistros.concat(registrosPagina);
        
        console.log(`[OMIE] Página ${pagina}: ${registrosPagina.length} registros obtidos. Total acumulado: ${todosRegistros.length}`);
      } catch (pageError) {
        console.error(`[OMIE] Erro na página ${pagina}:`, pageError.message);
        // Continua mesmo se uma página falhar
      }
    }

    const registros = todosRegistros;
    console.log(`[OMIE] Sincronização completa: ${registros.length} ${tipo} obtidos no total`);

    // Salvar dados no banco (se tiver integracaoId)
    if (req.body.integracaoId) {
      let salvosComSucesso = 0;
      let erros = 0;
      
      try {
        // Salvar registros nas tabelas
        for (let i = 0; i < registros.length; i++) {
          const registro = registros[i];
          try {
            if (tipo === 'clientes') {
              await poolTransacional.query(
                `INSERT INTO clientes (integracao_id, external_id, nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep, data_json)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (integracao_id, external_id) 
                 DO UPDATE SET nome = $3, email = $4, telefone = $5, cpf_cnpj = $6, endereco = $7, cidade = $8, estado = $9, cep = $10, data_json = $11, updated_at = CURRENT_TIMESTAMP`,
                [
                  req.body.integracaoId,
                  registro.codigo_cliente_omie || registro.codigo_cliente,
                  registro.razao_social || registro.nome_fantasia || registro.cnpj_cpf || 'Cliente sem nome',
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
              salvosComSucesso++;
            } else if (tipo === 'produtos') {
              await poolTransacional.query(
                `INSERT INTO produtos (integracao_id, external_id, codigo, nome, descricao, preco, estoque, unidade, categoria, ativo, data_json)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (integracao_id, external_id)
                 DO UPDATE SET codigo = $3, nome = $4, descricao = $5, preco = $6, estoque = $7, unidade = $8, categoria = $9, ativo = $10, data_json = $11, updated_at = CURRENT_TIMESTAMP`,
                [
                  req.body.integracaoId,
                  registro.codigo_produto,
                  registro.codigo,
                  registro.descricao || registro.codigo || 'Produto sem nome',
                  registro.descricao_detalhada,
                  registro.valor_unitario,
                  registro.quantidade_estoque,
                  registro.unidade,
                  registro.nome_familia,
                  registro.inativo === 'N',
                  JSON.stringify(registro)
                ]
              );
              salvosComSucesso++;
            }
            
            // Log a cada 100 registros
            if ((i + 1) % 100 === 0) {
              console.log(`[OMIE] Progresso ${tipo}: ${i + 1}/${registros.length} (${salvosComSucesso} salvos, ${erros} erros)`);
            }
          } catch (itemError) {
            erros++;
            console.error(`[OMIE] Erro ao salvar ${tipo} ${i + 1}/${registros.length}:`, itemError.message);
            // Continua com o próximo registro
          }
        }

        console.log(`[OMIE] Finalizado: ${salvosComSucesso}/${registros.length} ${tipo} salvos no banco (${erros} erros)`);

        // Atualizar status da integração
        await Integracao.update(req.body.integracaoId, {
          status: 'conectado',
          ultima_sincronizacao: new Date()
        });

        // Registrar log de sincronização
        await poolGestao.query(
          `INSERT INTO logs_sincronizacao (integracao_id, tipo, status, total_registros, mensagem)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.body.integracaoId, tipo, 'sucesso', salvosComSucesso, `Sincronização de ${tipo} concluída com sucesso`]
        );
      } catch (dbError) {
        console.error('[OMIE] Erro ao salvar no banco:', dbError);
        throw dbError;
      }
    }

    return res.json({
      success: true,
      data: registros,
      total: registros.length,
      tipo: tipo
    });

  } catch (error) {
    console.error('[OMIE] Erro na sincronização:', error);

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
