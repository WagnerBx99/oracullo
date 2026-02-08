-- Stored Procedure para unificação automática de clientes por CPF/CNPJ
-- Este script deve ser executado no DB Analítico

-- Função para unificar clientes
CREATE OR REPLACE FUNCTION unificar_clientes()
RETURNS TABLE(
    total_clientes_transacional INT,
    total_clientes_unificados INT,
    clientes_duplicados INT,
    clientes_em_multiplas_filiais INT
) AS $$
DECLARE
    v_total_transacional INT;
    v_total_unificado INT;
    v_duplicados INT;
    v_multiplas_filiais INT;
BEGIN
    -- Limpar tabela de clientes unificados
    TRUNCATE TABLE clientes_unificados;

    -- Unificar clientes por CPF/CNPJ
    INSERT INTO clientes_unificados (
        cpf_cnpj,
        nome,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        total_filiais,
        filiais_ids,
        primeiro_cadastro,
        ultima_atualizacao,
        created_at,
        updated_at
    )
    SELECT 
        c.cpf_cnpj,
        -- Pegar o nome mais recente
        (SELECT nome FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT nome FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''' ORDER BY updated_at DESC LIMIT 1'
        ) AS t(nome VARCHAR)) as nome,
        -- Pegar o email mais recente não nulo
        (SELECT email FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT email FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''' AND email IS NOT NULL AND email != '''' ORDER BY updated_at DESC LIMIT 1'
        ) AS t(email VARCHAR)) as email,
        -- Pegar o telefone mais recente não nulo
        (SELECT telefone FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT telefone FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''' AND telefone IS NOT NULL AND telefone != '''' ORDER BY updated_at DESC LIMIT 1'
        ) AS t(telefone VARCHAR)) as telefone,
        -- Pegar o endereço mais recente não nulo
        (SELECT endereco FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT endereco FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''' AND endereco IS NOT NULL AND endereco != '''' ORDER BY updated_at DESC LIMIT 1'
        ) AS t(endereco TEXT)) as endereco,
        -- Pegar a cidade mais recente não nula
        (SELECT cidade FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT cidade FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''' AND cidade IS NOT NULL AND cidade != '''' ORDER BY updated_at DESC LIMIT 1'
        ) AS t(cidade VARCHAR)) as cidade,
        -- Pegar o estado mais recente não nulo
        (SELECT estado FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT estado FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''' AND estado IS NOT NULL AND estado != '''' ORDER BY updated_at DESC LIMIT 1'
        ) AS t(estado VARCHAR)) as estado,
        -- Pegar o CEP mais recente não nulo
        (SELECT cep FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT cep FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''' AND cep IS NOT NULL AND cep != '''' ORDER BY updated_at DESC LIMIT 1'
        ) AS t(cep VARCHAR)) as cep,
        -- Contar em quantas filiais o cliente está
        (SELECT COUNT(DISTINCT integracao_id)::INT FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT integracao_id FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''''
        ) AS t(integracao_id INT)) as total_filiais,
        -- Array de IDs das filiais
        (SELECT ARRAY_AGG(DISTINCT integracao_id) FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT integracao_id FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''''
        ) AS t(integracao_id INT)) as filiais_ids,
        -- Data do primeiro cadastro
        (SELECT MIN(created_at) FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT created_at FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''''
        ) AS t(created_at TIMESTAMP)) as primeiro_cadastro,
        -- Data da última atualização
        (SELECT MAX(updated_at) FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT updated_at FROM clientes WHERE cpf_cnpj = ''' || c.cpf_cnpj || ''''
        ) AS t(updated_at TIMESTAMP)) as ultima_atualizacao,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
    FROM (
        SELECT DISTINCT cpf_cnpj
        FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            'SELECT DISTINCT cpf_cnpj FROM clientes WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '''''
        ) AS t(cpf_cnpj VARCHAR)
    ) c;

    -- Calcular estatísticas
    SELECT COUNT(*)::INT INTO v_total_transacional
    FROM dblink(
        'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
        'SELECT COUNT(*) FROM clientes'
    ) AS t(count BIGINT);

    SELECT COUNT(*)::INT INTO v_total_unificado
    FROM clientes_unificados;

    v_duplicados := v_total_transacional - v_total_unificado;

    SELECT COUNT(*)::INT INTO v_multiplas_filiais
    FROM clientes_unificados
    WHERE total_filiais > 1;

    -- Retornar estatísticas
    RETURN QUERY SELECT 
        v_total_transacional,
        v_total_unificado,
        v_duplicados,
        v_multiplas_filiais;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para unificação automática após sincronização
-- (Será implementado posteriormente quando houver trigger de sincronização)

-- Comentários para documentação
COMMENT ON FUNCTION unificar_clientes() IS 'Unifica clientes do DB Transacional por CPF/CNPJ no DB Analítico, consolidando dados de múltiplas filiais';
