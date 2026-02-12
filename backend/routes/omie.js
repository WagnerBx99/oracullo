import express from 'express';
import axios from 'axios';
import { Integracao } from '../models/Integracao.js';
import { poolGestao, poolTransacional } from '../config/databases.js';

const router = express.Router();

// Função para sincronizar custos da filial Curitiba
async function sincronizarCustosCuritiba(appKey, appSecret) {
  let custosAtualizados = 0;
  let pagina = 1;
  let totalPaginas = 1;

  try {
    while (pagina <= totalPaginas) {
      // Buscar posição de estoque (contém nCMC - Custo Médio Contábil)
      const response = await axios.post('https://app.omie.com.br/api/v1/estoque/consulta/', {
        call: 'ListarPosEstoque',
        app_key: appKey,
        app_secret: appSecret,
        param: [{
          nPagina: pagina,
          nRegPorPagina: 100
        }]
      });

      const dados = response.data;
      totalPaginas = dados.nTotPaginas;

      // Atualizar custo de cada produto
      for (const produto of dados.produtos) {
        const codigo = produto.cCodigo;
        const custo = produto.nCMC; // Custo Médio Contábil

        if (custo && custo > 0) {
          try {
            const result = await poolTransacional.query(
              `UPDATE produtos 
               SET 
                 custo = $1,
                 margem = CASE 
                   WHEN preco > 0 THEN ((preco - $1) / preco * 100)
                   ELSE 0
                 END,
                 updated_at = CURRENT_TIMESTAMP
               WHERE codigo = $2 AND ativo = true`,
              [custo, codigo]
            );
            
            if (result.rowCount > 0) {
              custosAtualizados++;
            }
          } catch (updateError) {
            console.error(`[OMIE] Erro ao atualizar custo do produto ${codigo}:`, updateError.message);
          }
        }
      }

      pagina++;
      
      // Aguardar 500ms entre requisições
      if (pagina <= totalPaginas) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return custosAtualizados;
  } catch (error) {
    console.error('[OMIE] Erro ao buscar custos:', error.message);
    throw error;
  }
}

// Função para converter data DD/MM/YYYY para YYYY-MM-DD
const convertDateFormat = (dateStr) => {
  if (!dateStr || dateStr === '') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
};

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
      
      if (pagina === 1) {
        console.log(`[OMIE DEBUG] Request para ${tipo}:`, JSON.stringify(requestBody, null, 2));
      }

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
    
    // Retornar resposta imediatamente para evitar timeout
    res.json({
      success: true,
      total: registros.length,
      tipo: tipo,
      message: `Sincronização de ${tipo} iniciada. ${registros.length} registros serão salvos em background.`
    });

    // Salvar dados no banco em background (se tiver integracaoId)
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
            } else if (tipo === 'pedidos') {
              await poolTransacional.query(
                `INSERT INTO pedidos (integracao_id, external_id, numero_pedido, data_pedido, valor_total, status, observacoes, data_json)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (integracao_id, external_id)
                 DO UPDATE SET numero_pedido = $3, data_pedido = $4, valor_total = $5, status = $6, observacoes = $7, data_json = $8, updated_at = CURRENT_TIMESTAMP`,
                [
                  req.body.integracaoId,
                  registro.cabecalho.codigo_pedido,
                  registro.cabecalho.numero_pedido,
                  convertDateFormat(registro.cabecalho.data_previsao),
                  registro.total_pedido?.valor_total_pedido || 0,
                  registro.cabecalho.etapa || 'pendente',
                  registro.observacoes?.obs_venda || '',
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

        // Se sincronizou produtos, buscar custos da filial Curitiba
        if (tipo === 'produtos') {
          console.log('[OMIE] Iniciando sincronização de custos da filial Curitiba...');
          try {
            const custosAtualizados = await sincronizarCustosCuritiba(api_key, app_secret);
            console.log(`[OMIE] Custos atualizados: ${custosAtualizados} produtos`);
          } catch (custoError) {
            console.error('[OMIE] Erro ao sincronizar custos:', custoError.message);
            // Não falha a sincronização se custos falharem
          }
        }

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
