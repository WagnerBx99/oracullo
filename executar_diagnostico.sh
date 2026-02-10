#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script de Diagnóstico Completo - Dashboard Oracullo
# ═══════════════════════════════════════════════════════════════════════════
# Este script executa todas as queries de diagnóstico e salva o resultado
# em um arquivo para análise.
# ═══════════════════════════════════════════════════════════════════════════

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações do banco de dados
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-oracullo_user}"
DB_PASSWORD="${DB_PASSWORD:-oracullo123}"

# Arquivo de saída
OUTPUT_FILE="diagnostico_resultado_$(date +%Y%m%d_%H%M%S).txt"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           DIAGNÓSTICO COMPLETO - Dashboard Oracullo${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Configurações:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Output: $OUTPUT_FILE"
echo ""

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ ERRO: psql não está instalado!${NC}"
    echo "Instale com: sudo apt-get install postgresql-client"
    exit 1
fi

echo -e "${GREEN}✅ psql encontrado${NC}"
echo ""

# Testar conexão
echo -e "${YELLOW}📡 Testando conexão com o banco de dados...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d oracullo_gestao -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ERRO: Não foi possível conectar ao banco de dados!${NC}"
    echo "Verifique as credenciais e se o PostgreSQL está rodando."
    exit 1
fi

echo -e "${GREEN}✅ Conexão estabelecida${NC}"
echo ""

# Executar diagnóstico
echo -e "${YELLOW}🔍 Executando diagnóstico completo...${NC}"
echo "Isso pode levar alguns segundos..."
echo ""

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -f diagnostico_completo.sql > $OUTPUT_FILE 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Diagnóstico concluído com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}                         RESUMO RÁPIDO${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Extrair informações chave do resultado
    echo -e "${YELLOW}📊 Dados Encontrados:${NC}"
    echo ""
    
    # Total de clientes
    TOTAL_CLIENTES=$(grep -A 1 "CARD 1 - Total de Clientes:" $OUTPUT_FILE | tail -1 | awk '{print $1}')
    if [ ! -z "$TOTAL_CLIENTES" ]; then
        echo "  🔹 Total de Clientes: $TOTAL_CLIENTES"
    fi
    
    # Integrações ativas
    INTEGRACOES_ATIVAS=$(grep -A 1 "CARD 4 - Integrações Ativas:" $OUTPUT_FILE | tail -1 | awk '{print $1}')
    if [ ! -z "$INTEGRACOES_ATIVAS" ]; then
        echo "  🔹 Integrações Ativas: $INTEGRACOES_ATIVAS"
    fi
    
    # Receita total
    RECEITA_TOTAL=$(grep -A 1 "CARD 2 - Receita Total" $OUTPUT_FILE | tail -1 | awk '{print $1}')
    if [ ! -z "$RECEITA_TOTAL" ]; then
        echo "  🔹 Receita Total (Fev/2026): R$ $RECEITA_TOTAL"
    fi
    
    # Total de pedidos
    TOTAL_PEDIDOS=$(grep "total_pedidos" $OUTPUT_FILE | head -1 | awk '{print $1}')
    if [ ! -z "$TOTAL_PEDIDOS" ]; then
        echo "  🔹 Total de Pedidos: $TOTAL_PEDIDOS"
    fi
    
    # Total de produtos
    TOTAL_PRODUTOS=$(grep "total_produtos" $OUTPUT_FILE | head -1 | awk '{print $1}')
    if [ ! -z "$TOTAL_PRODUTOS" ]; then
        echo "  🔹 Total de Produtos: $TOTAL_PRODUTOS"
    fi
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}📄 Resultado completo salvo em: $OUTPUT_FILE${NC}"
    echo ""
    echo -e "${YELLOW}📋 Próximos passos:${NC}"
    echo "  1. Abra o arquivo: cat $OUTPUT_FILE"
    echo "  2. Ou envie para análise: cat $OUTPUT_FILE | less"
    echo "  3. Ou copie o conteúdo e envie para o desenvolvedor"
    echo ""
else
    echo -e "${RED}❌ ERRO ao executar diagnóstico!${NC}"
    echo "Verifique o arquivo de saída para detalhes: $OUTPUT_FILE"
    exit 1
fi
