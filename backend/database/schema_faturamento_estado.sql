-- Criação da tabela de linha de venda (sales_transactions)
CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(2) NOT NULL,
    product_code INTEGER,
    sale_date DATE,
    brand VARCHAR(255),
    subgroup VARCHAR(255),
    invoice_number INTEGER,
    client_name VARCHAR(255),
    branch VARCHAR(255),
    salesperson VARCHAR(255),
    payment_term VARCHAR(255),
    product VARCHAR(255),
    unit_price DECIMAL(10,2),
    quantity DECIMAL(10,2),
    unit_cost DECIMAL(10,2),
    liters_qty DECIMAL(10,2),
    packaging_type VARCHAR(50),
    ref_month INTEGER,
    ref_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de configuração de marcas (brand_configs)
CREATE TABLE IF NOT EXISTS brand_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(255) UNIQUE NOT NULL,
    operational_cost_pct DECIMAL(5,4),
    salesperson_comm_pct DECIMAL(5,4) DEFAULT 0.0100,
    internal_comm_pct DECIMAL(5,4) DEFAULT 0.0050,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Triggers para atualizar o updated_at em brand_configs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_brand_configs_updated_at ON brand_configs;
CREATE TRIGGER trg_brand_configs_updated_at
BEFORE UPDATE ON brand_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- Criação da tabela de embalagens dos produtos (products_packaging)
CREATE TABLE IF NOT EXISTS products_packaging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code INTEGER,
    product_name VARCHAR(255),
    package_type VARCHAR(50),
    unit_volume DECIMAL(10,3)
);

-- Índices úteis visando o relatório de faturamento por estado
CREATE INDEX IF NOT EXISTS idx_sales_transactions_state ON sales_transactions(state);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_ref_date ON sales_transactions(ref_year, ref_month);
CREATE INDEX IF NOT EXISTS idx_products_packaging_code ON products_packaging(product_code);
