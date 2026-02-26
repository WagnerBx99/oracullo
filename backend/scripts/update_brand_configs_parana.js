import { poolAnalitico } from '../config/databases.js';
import * as xlsx from 'xlsx';
import fs from 'fs';

async function updateConfigs() {
    console.log('🔄 Atualizando brand_configs com dados do Paraná...');

    const filePath = '/Users/cason/Projects/cason_oracullo/reports/2. Faturamento - 2025 - Paraná.xlsx';
    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        process.exit(1);
    }
    const buf = fs.readFileSync(filePath);
    const workbook = xlsx.read(buf, { type: 'buffer' });

    try {
        const bSheets = workbook.SheetNames.filter(n => n.trim().endsWith(' B'));
        const firstBSheet = bSheets[0];
        const dataSalesForConfig = firstBSheet ? xlsx.utils.sheet_to_json(workbook.Sheets[firstBSheet], { header: 1, range: 3 }) : [];
        const opCostByBrand = {};
        for (const row of dataSalesForConfig) {
            const tempBrand = row[2]; // Marca é idx 2
            const tempOpCost = parseFloat(row[22]); // Custo Oper % é idx 22
            if (tempBrand && !isNaN(tempOpCost)) {
                opCostByBrand[tempBrand] = tempOpCost;
            }
        }

        const sheetBase = workbook.Sheets['Base'];
        if (sheetBase) {
            const dataBase = xlsx.utils.sheet_to_json(sheetBase, { header: 1, range: 2 });
            let updatedCount = 0;
            const brandsAdded = new Set();
            for (const row of dataBase) {
                const brand = row[13]; // coluna N
                const commVendedor = parseFloat(row[14]); // coluna O
                const commInterna = parseFloat(row[15]);  // coluna P

                if (brand && typeof brand === 'string' && !brandsAdded.has(brand)) {
                    const finalCommV = isNaN(commVendedor) ? 0.01 : commVendedor;
                    const finalCommI = isNaN(commInterna) ? 0.005 : commInterna;
                    const finalOpCost = typeof opCostByBrand[brand] !== 'undefined' ? opCostByBrand[brand] : 0.2085;

                    await poolAnalitico.query(
                        `INSERT INTO brand_configs (brand, operational_cost_pct, salesperson_comm_pct, internal_comm_pct, manager_comm_pct)
                         VALUES ($1, $2, $3, $4, $5)
                         ON CONFLICT (brand) DO UPDATE SET
                         operational_cost_pct = EXCLUDED.operational_cost_pct,
                         salesperson_comm_pct = EXCLUDED.salesperson_comm_pct,
                         internal_comm_pct = EXCLUDED.internal_comm_pct`,
                        [brand, finalOpCost, finalCommV, finalCommI, 0.01]
                    );
                    brandsAdded.add(brand);
                    updatedCount++;
                }
            }
            console.log(`✅ Configurações de ${updatedCount} marcas atualizadas com sucesso a partir do Paraná!`);
        } else {
            console.log('❌ Aba Base não encontrada.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante atualização:', error);
        process.exit(1);
    }
}

updateConfigs();
