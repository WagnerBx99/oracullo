import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'oracullo_user',
    host: 'localhost',
    database: 'oracullo_analitico',
    password: 'oracullo123',
    port: 5432,
});

async function run() {
    try {
        console.log("Adicionando colunas de comissão...");
        await pool.query(`
            ALTER TABLE sales_transactions 
            ADD COLUMN IF NOT EXISTS salesperson_comm_pct DECIMAL(5,4),
            ADD COLUMN IF NOT EXISTS salesperson_comm_rs DECIMAL(10,2)
        `);

        console.log("Atualizando dados existentes com base em brand_configs...");
        const res = await pool.query(`
            UPDATE sales_transactions s
            SET 
                salesperson_comm_pct = c.salesperson_comm_pct,
                salesperson_comm_rs = (COALESCE(s.total_sale_raw, s.unit_price * s.quantity) * COALESCE(c.salesperson_comm_pct, 0.01))
            FROM brand_configs c
            WHERE s.brand = c.brand
        `);

        console.log(`Sucesso! ${res.rowCount} linhas atualizadas.`);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
