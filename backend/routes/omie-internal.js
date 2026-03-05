
import express from 'express';
import axios from 'axios';
import { poolGestao, poolTransacional } from '../config/databases.js';

const router = express.Router();

// Buscar todas as integrações OMIE
async function getOmieIntegracoes() {
  const result = await poolGestao.query(
    "SELECT id, nome, api_key, company_token FROM integracoes WHERE sistema = 'omie' ORDER BY nome"
  );
  return result.rows;
}

// Sincronizar clientes de todas as filiais
router.post('/sync/clientes', async (req, res) => {
  try {
    const integracoes = await getOmieIntegracoes();
    let totalGeral = 0;
    let insertedGeral = 0;
    let updatedGeral = 0;

    for (const integracao of integracoes) {
      try {
        let pagina = 1;
        let totalPaginas = 1;

        while (pagina <= totalPaginas) {
          const response = await axios.post('https://app.omie.com.br/api/v1/geral/clientes/', {
            call: 'ListarClientes',
            app_key: integracao.api_key,
            app_secret: integracao.company_token,
            param: [{
              pagina,
              registros_por_pagina: 100
            }]
          });

          const dados = response.data;
          totalPaginas = dados.total_de_paginas;
          totalGeral += dados.total_de_registros;

          for (const cliente of dados.clientes_cadastro || []) {
            const result = await poolTransacional.query(`
              INSERT INTO clientes 
              (integracao_id, external_id, codigo_omie, nome, cpf_cnpj, email, telefone, cidade, estado, ativo, data_json)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (integracao_id, external_id) DO UPDATE
              SET codigo_omie = EXCLUDED.codigo_omie, nome = EXCLUDED.nome, cpf_cnpj = EXCLUDED.cpf_cnpj, email = EXCLUDED.email, telefone = EXCLUDED.telefone,
                  cidade = EXCLUDED.cidade, estado = EXCLUDED.estado, ativo = EXCLUDED.ativo, data_json = EXCLUDED.data_json,
                  updated_at = CURRENT_TIMESTAMP
              RETURNING (xmax = 0) AS inserted
            `, [
              integracao.id,
              String(cliente.codigo_cliente_omie || `OMIE_NULL_ID_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`), // external_id
              cliente.codigo_cliente_omie, // codigo_omie
              cliente.razao_social || cliente.nome_fantasia,
              cliente.cpf_cnpj,
              cliente.email,
              cliente.telefone1_numero,
              cliente.cidade,
              cliente.estado,
              true,
              JSON.stringify(cliente)
            ]);

            if (result.rows[0].inserted) {
              insertedGeral++;
            } else {
              updatedGeral++;
            }
          }

          pagina++;
          if (pagina <= totalPaginas) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error(`Erro ao sincronizar clientes da filial ${integracao.nome}:`, error.message);
      }
    }

    res.json({ success: true, total: totalGeral, inserted: insertedGeral, updated: updatedGeral });
  } catch (error) {
    console.error("Erro ao sincronizar clientes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sincronizar produtos de todas as filiais
router.post("/sync/produtos", async (req, res) => {
  try {
    const integracoes = await getOmieIntegracoes();
    let totalGeral = 0;
    let insertedGeral = 0;
    let updatedGeral = 0;

    for (const integracao of integracoes) {
      try {
        let pagina = 1;
        let totalPaginas = 1;

        while (pagina <= totalPaginas) {
          const response = await axios.post("https://app.omie.com.br/api/v1/geral/produtos/", {
            call: "ListarProdutos",
            app_key: integracao.api_key,
            app_secret: integracao.company_token,
            param: [
              {
                pagina,
                registros_por_pagina: 100,
              },
            ],
          });

          const dados = response.data;
          totalPaginas = dados.total_de_paginas;
          totalGeral += dados.total_de_registros;

          for (const produto of dados.produto_servico_cadastro || []) {
            const result = await poolTransacional.query(
              `
              INSERT INTO produtos 
              (integracao_id, codigo, descricao, unidade, preco, custo, estoque, ativo, data_json)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (integracao_id, codigo) DO UPDATE
              SET descricao = EXCLUDED.descricao, unidade = EXCLUDED.unidade, preco = EXCLUDED.preco, custo = EXCLUDED.custo,
                  estoque = EXCLUDED.estoque, ativo = EXCLUDED.ativo, data_json = EXCLUDED.data_json,
                  updated_at = CURRENT_TIMESTAMP
              RETURNING (xmax = 0) AS inserted
            `,
              [
                integracao.id,
                produto.codigo_produto,
                produto.descricao,
                produto.unidade,
                produto.valor_unitario || 0,
                0,
                0,
                true,
                JSON.stringify(produto),
              ]
            );

            if (result.rows[0].inserted) {
              insertedGeral++;
            } else {
              updatedGeral++;
            }
          }

          pagina++;
          if (pagina <= totalPaginas) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error(
          `Erro ao sincronizar produtos da filial ${integracao.nome}:`,
          error.message
        );
      }
    }

    res.json({ success: true, total: totalGeral, inserted: insertedGeral, updated: updatedGeral });
  } catch (error) {
    console.error("Erro ao sincronizar produtos:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sincronizar pedidos
router.post("/sync/pedidos", async (req, res) => {
  try {
    const integracoes = await getOmieIntegracoes();
    let totalGeral = 0;
    let insertedGeral = 0;
    let updatedGeral = 0;

    for (const integracao of integracoes) {
      try {
        let pagina = 1;
        let totalPaginas = 1;

        while (pagina <= totalPaginas) {
          const response = await axios.post("https://app.omie.com.br/api/v1/produtos/pedido/", {
            call: "ListarPedidos",
            app_key: integracao.api_key,
            app_secret: integracao.company_token,
            param: [
              {
                pagina,
                registros_por_pagina: 100,
                apenas_importado_api: "N",
                filtrar_apenas_omiepdv: "N",
              },
            ],
          });

          const dados = response.data;
          totalPaginas = dados.total_de_paginas;
          totalGeral += dados.total_de_registros;

          for (const pedido of dados.pedido_venda_produto || []) {
            const result = await poolTransacional.query(
              `
              INSERT INTO pedidos
              (integracao_id, external_id, cliente_id, numero_pedido, data_pedido, valor_total, status, observacoes, data_json)
              VALUES ($1, $2, (SELECT id FROM clientes WHERE integracao_id = $1 AND codigo_omie = $3), $4, $5, $6, $7, $8, $9)
              ON CONFLICT (integracao_id, external_id) DO UPDATE
              SET cliente_id = (SELECT id FROM clientes WHERE integracao_id = $1 AND codigo_omie = $3), numero_pedido = $4, data_pedido = $5, valor_total = $6, status = $7, observacoes = $8, data_json = $9, updated_at = CURRENT_TIMESTAMP
              RETURNING id, (xmax = 0) AS inserted
            `,
              [
                integracao.id,
                pedido.cabecalho.cCodIntPed,
                pedido.cabecalho.nCodCli,
                pedido.cabecalho.cNumero,
                pedido.cabecalho.dDtPrevisao,
                pedido.total_pedido.nValorTotal,
                pedido.info_adicionais.cSitPed,
                pedido.info_adicionais.cObsPedido,
                JSON.stringify(pedido),
              ]
            );

            const pedidoId = result.rows[0].id;
            if (result.rows[0].inserted) {
              insertedGeral++;
            } else {
              updatedGeral++;
            }

            for (const item of pedido.det) {
              await poolTransacional.query(
                `
                INSERT INTO pedido_itens
                (pedido_id, produto_id, quantidade, preco_unitario, desconto, valor_total)
                VALUES ($1, (SELECT id FROM produtos WHERE integracao_id = $7 AND codigo = $2), $3, $4, $5, $6)
              `,
                [
                  pedidoId,
                  item.produto.cCodigo,
                  item.produto.nQtde,
                  item.produto.nValUnit,
                  item.produto.nValDesc,
                  item.produto.nValTotal,
                ]
              );
            }
          }

          pagina++;
          if (pagina <= totalPaginas) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error(
          `Erro ao sincronizar pedidos da filial ${integracao.nome}:`,
          error.message
        );
      }
    }

    res.json({ success: true, total: totalGeral, inserted: insertedGeral, updated: updatedGeral });
  } catch (error) {
    console.error("Erro ao sincronizar pedidos:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sincronizar estoque
router.post("/sync/estoque", async (req, res) => {
  try {
    res.json({ success: true, total: 0, inserted: 0, updated: 0, message: "Sincronização de estoque não implementada" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook de teste OMIE
router.post("/webhook", (req, res) => {
  const body = req.body;

  // Log colorido no console, truncando se for muito grande
  const maxLength = 1000;
  const displayed = JSON.stringify(body, null, 2).slice(0, maxLength);
  console.log("========== WEBHOOK OMIE ==========");
  console.log(displayed + (displayed.length < JSON.stringify(body, null, 2).length ? "\n...[truncated]" : ""));
  console.log("==================================");

  res.status(200).send("OK");
});




// Sincronizar produtos de todas as filiais
router.post('/sync/produtos', async (req, res) => {
  try {
    const integracoes = await getOmieIntegracoes();
    let totalGeral = 0;
    let insertedGeral = 0;
    let updatedGeral = 0;

    for (const integracao of integracoes) {
      try {
        let pagina = 1;
        let totalPaginas = 1;

        while (pagina <= totalPaginas) {
          const response = await axios.post('https://app.omie.com.br/api/v1/geral/produtos/', {
            call: 'ListarProdutos',
            app_key: integracao.api_key,
            app_secret: integracao.company_token,
            param: [{
              pagina,
              registros_por_pagina: 100
            }]
          });

          const dados = response.data;
          totalPaginas = dados.total_de_paginas;
          totalGeral += dados.total_de_registros;

          for (const produto of dados.produto_servico_cadastro || []) {
            const result = await poolTransacional.query(`
              INSERT INTO produtos 
              (codigo, descricao, unidade, preco, custo, estoque, ativo, data_json)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (codigo) DO UPDATE
              SET descricao = $2, unidade = $3, preco = $4, custo = $5,
                  estoque = $6, ativo = $7, data_json = $8,
                  updated_at = CURRENT_TIMESTAMP
              RETURNING (xmax = 0) AS inserted
            `, [
              produto.codigo_produto,
              produto.descricao,
              produto.unidade,
              produto.valor_unitario || 0,
              0,
              0,
              true,
              JSON.stringify(produto)
            ]);

            if (result.rows[0].inserted) {
              insertedGeral++;
            } else {
              updatedGeral++;
            }
          }

          pagina++;
          if (pagina <= totalPaginas) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error(`Erro ao sincronizar produtos da filial ${integracao.nome}:`, error.message);
      }
    }

    res.json({ success: true, total: totalGeral, inserted: insertedGeral, updated: updatedGeral });
  } catch (error) {
    console.error('Erro ao sincronizar produtos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sincronizar pedidos
router.post('/sync/pedidos', async (req, res) => {
  try {
    const integracoes = await getOmieIntegracoes();
    let totalGeral = 0;
    let insertedGeral = 0;
    let updatedGeral = 0;

    for (const integracao of integracoes) {
      try {
        let pagina = 1;
        let totalPaginas = 1;

        while (pagina <= totalPaginas) {
          const response = await axios.post('https://app.omie.com.br/api/v1/produtos/pedido/', {
            call: 'ListarPedidos',
            app_key: integracao.api_key,
            app_secret: integracao.company_token,
            param: [{
              pagina,
              registros_por_pagina: 100,
              apenas_importado_api: "N",
              filtrar_apenas_omiepdv: "N"
            }]
          });

          const dados = response.data;
          totalPaginas = dados.total_de_paginas;
          totalGeral += dados.total_de_registros;

          for (const pedido of dados.pedido_venda_produto || []) {
            const result = await poolTransacional.query(`
              INSERT INTO pedidos
              (integracao_id, external_id, cliente_id, numero_pedido, data_pedido, valor_total, status, observacoes, data_json)
              VALUES ($1, $2, (SELECT id FROM clientes WHERE integracao_id = $1 AND codigo_omie = $3), $4, $5, $6, $7, $8, $9)
              ON CONFLICT (integracao_id, external_id) DO UPDATE
              SET cliente_id = (SELECT id FROM clientes WHERE integracao_id = $1 AND codigo_omie = $3), numero_pedido = $4, data_pedido = $5, valor_total = $6, status = $7, observacoes = $8, data_json = $9, updated_at = CURRENT_TIMESTAMP
              RETURNING id, (xmax = 0) AS inserted
            `, [
              integracao.id,
              pedido.cabecalho.cCodIntPed,
              pedido.cabecalho.nCodCli,
              pedido.cabecalho.cNumero,
              pedido.cabecalho.dDtPrevisao,
              pedido.total_pedido.nValorTotal,
              pedido.info_adicionais.cSitPed,
              pedido.info_adicionais.cObsPedido,
              JSON.stringify(pedido)
            ]);

            const pedidoId = result.rows[0].id;
            if (result.rows[0].inserted) {
              insertedGeral++;
            } else {
              updatedGeral++;
            }

            for (const item of pedido.det) {
              await poolTransacional.query(`
                INSERT INTO pedido_itens
                (pedido_id, produto_id, quantidade, preco_unitario, desconto, valor_total)
                VALUES ($1, (SELECT id FROM produtos WHERE integracao_id = $7 AND codigo = $2), $3, $4, $5, $6)
              `, [
                pedidoId,
                item.produto.cCodigo,
                item.produto.nQtde,
                item.produto.nValUnit,
                item.produto.nValDesc,
                item.produto.nValTotal,
                integracao.id
              ]);
            }
          }

          pagina++;
          if (pagina <= totalPaginas) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error(`Erro ao sincronizar pedidos da filial ${integracao.nome}:`, error.message);
      }
    }

    res.json({ success: true, total: totalGeral, inserted: insertedGeral, updated: updatedGeral });
  } catch (error) {
    console.error('Erro ao sincronizar pedidos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sincronizar estoque
router.post('/sync/estoque', async (req, res) => {
  try {
    res.json({ success: true, total: 0, inserted: 0, updated: 0, message: 'Sincronização de estoque não implementada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook de teste OMIE
router.post('/webhook', (req, res) => {
  const body = req.body;

  // Log colorido no console, truncando se for muito grande
  const maxLength = 1000;
  const displayed = JSON.stringify(body, null, 2).slice(0, maxLength);
  console.log('========== WEBHOOK OMIE ==========');
  console.log(displayed + (displayed.length < JSON.stringify(body, null, 2).length ? '\n...[truncated]' : ''));
  console.log('==================================');

  res.status(200).send('OK');
});




export default router;
