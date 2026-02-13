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
              (codigo_omie, nome, cnpj_cpf, email, telefone, cidade, estado, ativo, data_json)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (codigo_omie) DO UPDATE
              SET nome = $2, cnpj_cpf = $3, email = $4, telefone = $5,
                  cidade = $6, estado = $7, ativo = $8, data_json = $9,
                  updated_at = CURRENT_TIMESTAMP
              RETURNING (xmax = 0) AS inserted
            `, [
              cliente.codigo_cliente_omie,
              cliente.razao_social || cliente.nome_fantasia,
              cliente.cnpj_cpf,
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
    console.error('Erro ao sincronizar clientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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
    res.json({ success: true, total: 0, inserted: 0, updated: 0, message: 'Sincronização de pedidos não implementada' });
  } catch (error) {
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

export default router;
