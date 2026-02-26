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
        await pool.query('ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS total_sale_raw DECIMAL(10,2)');
        console.log("Column added successfully.");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
