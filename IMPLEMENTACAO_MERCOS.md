# Implementação da Integração MERCOS - Projeto Oracullo

## ✅ Status: Implementação Inicial Concluída

Data: 01/02/2026

---

## 📋 O que foi implementado

### 1. Serviço de API (`/src/api/mercosService.js`)

Criamos uma classe completa `MercosService` que encapsula toda a lógica de comunicação com a API do MERCOS:

**Funcionalidades implementadas:**
- ✅ Autenticação via `ApplicationToken` e `CompanyToken`
- ✅ Tratamento automático de throttling (HTTP 429)
- ✅ Paginação automática para grandes volumes de dados
- ✅ Sincronização incremental usando `alterado_apos`
- ✅ Métodos para buscar Clientes, Produtos e Pedidos
- ✅ Métodos para criar e atualizar Clientes
- ✅ Teste de conexão

**Características técnicas:**
- Usa `axios` para requisições HTTP
- Aguarda automaticamente quando recebe throttling
- Percorre todas as páginas de resultados automaticamente
- Retorna arrays completos de dados

### 2. Integração com a Interface (`/src/pages/Integracoes.jsx`)

Atualizamos a página de Integrações para incluir funcionalidade real de sincronização:

**O que foi adicionado:**
- ✅ Importação do `MercosService`
- ✅ Mutation para sincronização (`syncMutation`)
- ✅ Botão "Sincronizar" funcional com feedback visual
- ✅ Atualização automática do status da integração
- ✅ Tratamento de erros
- ✅ Indicador de carregamento (spinner)

**Fluxo de sincronização:**
1. Usuário clica em "Sincronizar"
2. Sistema testa conexão com MERCOS
3. Busca clientes e produtos
4. Atualiza status para "conectado"
5. Salva data/hora da última sincronização
6. Atualiza interface automaticamente

### 3. Credenciais e Configuração

**Arquivo criado:** `/MERCOS_CREDENTIALS.md`

Contém:
- Company Token do sandbox
- Application Token
- URLs de acesso
- Instruções de uso

**Credenciais configuradas:**
- **Company Token**: `2a2ff3ec-c3ab-11f0-b7b0-5605c2a06131`
- **Application Token** (sandbox): `d39001ac-0b14-11f0-8ed7-6e1485be00f2`
- **Ambiente**: Sandbox (testes)

### 4. Testes Realizados

**Arquivo de teste:** `/test_mercos.js`

✅ **Resultados dos testes:**
- Conexão com API: **OK**
- Busca de clientes: **OK** (0 registros no sandbox vazio)
- Busca de produtos: **OK** (0 registros no sandbox vazio)
- Busca de pedidos: **OK** (0 registros no sandbox vazio)
- Tratamento de throttling: **OK**

---

## 🚀 Como usar

### 1. Criar uma integração MERCOS

Na interface do Oracullo:
1. Acesse "Integrações"
2. Clique em "Nova Integração"
3. Preencha:
   - **Nome**: "MERCOS Sandbox"
   - **Tipo**: CRM
   - **Sistema**: mercos
   - **API Key**: `d39001ac-0b14-11f0-8ed7-6e1485be00f2`
   - **Company Token**: `2a2ff3ec-c3ab-11f0-b7b0-5605c2a06131`

### 2. Sincronizar dados

1. Clique no botão "Sincronizar" no card da integração
2. Aguarde o processo (pode levar alguns segundos)
3. Verifique o status atualizado

### 3. Testar via linha de comando

```bash
cd /var/www/oracullo_LuizGouveia
node test_mercos.js
```

---

## 📝 Próximos Passos

### Curto Prazo (Essencial)
1. **Criar entidades no Base44** para armazenar:
   - `Cliente` (com campos mapeados do MERCOS)
   - `Produto` (com campos mapeados do MERCOS)
   - `Pedido` (com campos mapeados do MERCOS)

2. **Implementar mapeamento de dados**:
   - Função para converter dados do MERCOS para formato do Oracullo
   - Salvar dados sincronizados nas entidades do Base44

3. **Adicionar campo `company_token`** na entidade `Integracao`:
   - Atualmente só temos `api_key`
   - MERCOS precisa de dois tokens

### Médio Prazo (Importante)
4. **Implementar webhooks**:
   - Criar endpoint para receber notificações do MERCOS
   - Configurar webhooks no painel do MERCOS
   - Sincronização em tempo real

5. **Melhorar tratamento de erros**:
   - Logs mais detalhados
   - Notificações para o usuário
   - Retry automático em caso de falha

6. **Sincronização bidirecional**:
   - Enviar dados do Oracullo para o MERCOS
   - Criar clientes no MERCOS via interface

### Longo Prazo (Otimização)
7. **Sincronização agendada**:
   - Executar automaticamente a cada X horas
   - Configurável por integração

8. **Dashboard de sincronização**:
   - Visualizar histórico de sincronizações
   - Estatísticas (quantos registros, tempo, erros)
   - Logs detalhados

---

## 🔧 Estrutura de Arquivos

```
oracullo_LuizGouveia/
├── src/
│   ├── api/
│   │   ├── mercosService.js          # ✅ NOVO: Serviço de API MERCOS
│   │   ├── integrations.js           # ✅ ATUALIZADO: Exporta MercosService
│   │   └── base44Client.js
│   └── pages/
│       └── Integracoes.jsx            # ✅ ATUALIZADO: Botão sincronizar funcional
├── test_mercos.js                     # ✅ NOVO: Script de teste
├── MERCOS_CREDENTIALS.md              # ✅ NOVO: Credenciais
└── IMPLEMENTACAO_MERCOS.md            # ✅ NOVO: Esta documentação
```

---

## ⚠️ Observações Importantes

1. **Ambiente Sandbox**: Atualmente configurado para usar o sandbox do MERCOS. Para produção, será necessário:
   - Obter tokens de produção
   - Alterar `isProduction` para `true` ao instanciar `MercosService`

2. **Throttling**: A API do MERCOS tem limite de requisições. O serviço trata isso automaticamente, mas sincronizações podem levar tempo.

3. **Dados Vazios**: O sandbox está vazio. Para testar com dados reais, será necessário:
   - Popular o sandbox via interface do MERCOS
   - Ou usar credenciais de produção (com cuidado)

4. **Dependências**: Foi instalado `axios` no projeto. Certifique-se de rodar `npm install` após fazer pull do repositório.

---

## 📞 Suporte

Em caso de dúvidas sobre a integração MERCOS:
- **Documentação**: https://mercos.docs.apiary.io/
- **Painel Sandbox**: https://sandbox.mercos.com/51303/homologacao/
- **Contato MERCOS**: Através do chat da plataforma
