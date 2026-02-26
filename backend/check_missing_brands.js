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
        console.log("Adding missing brand configs...");

        // Map the missing names to existing names to copy rules from
        const mapping = {
            'ATF 6000 ADAPTADORES': 'FERRAMENTAS E ADAPTADORES',
            'MANNOL ARREFECIMENTO': 'MANNOL',
            'THE EAGLE PEÇAS E FERRAMENTAS': 'EAGLE PEÇAS',
        };

        for (const [missingBrand, sourceBrand] of Object.entries(mapping)) {
            // Get source brand config
            const res = await pool.query('SELECT * FROM brand_configs WHERE brand = $1', [sourceBrand]);
            let config = null;
            if (res.rows.length > 0) {
                config = res.rows[0];
            } else {
                // Default if not found
                config = {
                    operational_cost_pct: 0.2085,
                    salesperson_comm_pct: 0.01,
                    internal_comm_pct: 0.005,
                    manager_comm_pct: 0.01
                };
            }

            // Insert for missing brand
            await pool.query(
                `INSERT INTO brand_configs (brand, operational_cost_pct, salesperson_comm_pct, internal_comm_pct, manager_comm_pct)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (brand) DO NOTHING`,
                [
                    missingBrand,
                    config.operational_cost_pct,
                    config.salesperson_comm_pct,
                    config.internal_comm_pct,
                    config.manager_comm_pct
                ]
            );
            console.log(`Inserted config for: ${missingBrand} (Based on ${sourceBrand})`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
