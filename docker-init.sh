#!/bin/bash
set -e

echo "Criando o usuário da aplicação e os três bancos de dados..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    CREATE USER oracullo_user WITH PASSWORD 'oracullo123';
    
    CREATE DATABASE oracullo_gestao;
    GRANT ALL PRIVILEGES ON DATABASE oracullo_gestao TO oracullo_user;
    ALTER DATABASE oracullo_gestao OWNER TO oracullo_user;
    
    CREATE DATABASE oracullo_transacional;
    GRANT ALL PRIVILEGES ON DATABASE oracullo_transacional TO oracullo_user;
    ALTER DATABASE oracullo_transacional OWNER TO oracullo_user;
    
    CREATE DATABASE oracullo_analitico;
    GRANT ALL PRIVILEGES ON DATABASE oracullo_analitico TO oracullo_user;
    ALTER DATABASE oracullo_analitico OWNER TO oracullo_user;
EOSQL

echo "Executando schema GESTÃO..."
psql -v --username "oracullo_user" --dbname "oracullo_gestao" -f /docker-entrypoint-initdb.d/sql/schema_gestao.sql

echo "Executando schema TRANSACIONAL..."
psql -v --username "oracullo_user" --dbname "oracullo_transacional" -f /docker-entrypoint-initdb.d/sql/schema_transacional.sql

echo "Executando schema ANALÍTICO..."
psql -v --username "oracullo_user" --dbname "oracullo_analitico" -f /docker-entrypoint-initdb.d/sql/schema_analitico.sql

echo "Inicialização concluída com sucesso."
