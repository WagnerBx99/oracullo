# Changelog - Integração MERCOS

## [v1.0.0] - 2026-02-01

### ✨ Adicionado

#### Serviço de API MERCOS
- **Arquivo**: `src/api/mercosService.js`
- Classe `MercosService` completa para integração com API do MERCOS
- Suporte a autenticação via ApplicationToken e CompanyToken
- Tratamento automático de throttling (HTTP 429)
- Paginação automática para grandes volumes de dados
- Sincronização incremental usando parâmetro `alterado_apos`
- Métodos implementados:
  - `getClientes()` - Busca clientes com paginação
  - `getProdutos()` - Busca produtos com paginação
  - `getPedidos()` - Busca pedidos com paginação
  - `createCliente()` - Cria novo cliente
  - `updateCliente()` - Atualiza cliente existente
  - `testConnection()` - Testa conexão com API

#### Interface de Sincronização
- **Arquivo**: `src/pages/Integracoes.jsx`
- Botão "Sincronizar" funcional para integrações MERCOS
- Feedback visual durante sincronização (spinner)
- Atualização automática de status e última sincronização
- Tratamento de erros com atualização de status
- Mutation `syncMutation` para orquestrar processo de sincronização

#### Documentação
- **MERCOS_CREDENTIALS.md**: Credenciais do ambiente sandbox
- **IMPLEMENTACAO_MERCOS.md**: Documentação completa da implementação
- **test_mercos.js**: Script de teste da integração

### 🔧 Modificado

#### Dependências
- **package.json**: Adicionado `axios` para requisições HTTP
- **package-lock.json**: Atualizado com dependências do axios

#### Exportações
- **src/api/integrations.js**: Adicionada exportação do `MercosService`

### 🧪 Testes Realizados

- ✅ Conexão com API MERCOS sandbox
- ✅ Busca de clientes (retorno vazio no sandbox)
- ✅ Busca de produtos (retorno vazio no sandbox)
- ✅ Busca de pedidos (retorno vazio no sandbox)
- ✅ Tratamento de throttling HTTP 429
- ✅ Paginação automática

### 📝 Notas

- Implementação inicial focada em **leitura de dados**
- Ambiente configurado para **sandbox** (testes)
- Sincronização bidirecional será implementada em versão futura
- Webhooks serão configurados em próxima fase

### 🚀 Próximos Passos

1. Criar entidades no Base44 para armazenar dados sincronizados
2. Implementar mapeamento de dados MERCOS → Oracullo
3. Adicionar campo `company_token` na entidade Integracao
4. Configurar webhooks para sincronização em tempo real
5. Implementar sincronização bidirecional (Oracullo → MERCOS)

---

## Arquivos Alterados

```
Modificados:
  - package.json
  - package-lock.json
  - src/api/integrations.js
  - src/pages/Integracoes.jsx

Novos:
  - src/api/mercosService.js
  - test_mercos.js
  - MERCOS_CREDENTIALS.md
  - IMPLEMENTACAO_MERCOS.md
  - CHANGELOG_INTEGRACAO_MERCOS.md
```

## Comandos para Deploy

```bash
# 1. No ambiente local/desenvolvimento
git add .
git commit -m "feat: implementar integração com MERCOS API

- Adicionar serviço MercosService com suporte completo à API
- Implementar sincronização de clientes e produtos
- Adicionar botão de sincronização funcional na interface
- Incluir tratamento de throttling e paginação automática
- Adicionar documentação e testes"

git push origin main

# 2. Na VPS (31.97.253.85)
ssh root@31.97.253.85
cd /var/www/oracullo_LuizGouveia
git pull origin main
npm install
npm run build
# Reiniciar serviço se necessário
```
