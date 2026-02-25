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
        const resByBranchAndSalesperson = await pool.query(`
            SELECT branch, salesperson, brand, SUM(unit_price * quantity) as faturamento_total
            FROM sales_transactions 
            GROUP BY branch, salesperson, brand
            ORDER BY branch, salesperson, brand
        `);
        console.table(resByBranchAndSalesperson.rows);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
