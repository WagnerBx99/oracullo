import { poolAnalitico } from '../config/databases.js';
import * as xlsx from 'xlsx';
import fs from 'fs';

// Função para converter data do Excel para formato YYYY-MM-DD
function excelDateToJSDate(serial) {
    if (!serial || isNaN(serial)) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);

    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;

    date_info.setUTCHours(hours, minutes, seconds);

    const year = date_info.getUTCFullYear();
    const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date_info.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

async function runSeed() {
    console.log('🌱 Iniciando Seed de Faturamento (PR)...');

    const filePath = '/Users/cason/Projects/cason_oracullo/reports/2. Faturamento - 2025 - Paraná.xlsx';
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }
    const buf = fs.readFileSync(filePath);
    const workbook = xlsx.read(buf, { type: 'buffer' });

    try {
        const bSheets = workbook.SheetNames.filter(n => n.trim().endsWith(' B'));
        console.log('Abas de Vendas (B) encontradas:', bSheets);

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
                         ON CONFLICT (brand) DO NOTHING`,
                        [brand, finalOpCost, finalCommV, finalCommI, 0.01]
                    );
                    brandsAdded.add(brand);
                }
            }
        }

        let salesCount = 0;
        for (const sheetName of bSheets) {
            console.log(`💰 Lendo Aba: ${sheetName}...`);
            const dataSales = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, range: 3 });

            for (const row of dataSales) {
                const cod = row[0]; // Código é idx 0
                if (cod && !isNaN(parseFloat(cod)) && String(cod).trim() !== '') {
                    const saleDateObj = excelDateToJSDate(row[1]); // Data é idx 1
                    if (!saleDateObj) continue;

                    const refYear = parseInt(saleDateObj.split('-')[0]);
                    const refMonth = parseInt(saleDateObj.split('-')[1]);
                    const liters = parseFloat(row[15]) || 0; // Litragem é idx 15

                    await poolAnalitico.query(
                        `INSERT INTO sales_transactions (
                          state, product_code, sale_date, brand, subgroup, invoice_number,
                          client_name, branch, salesperson, payment_term, product,
                          unit_price, quantity, unit_cost, total_sale_raw, liters_qty, packaging_type,
                          ref_month, ref_year
                        ) VALUES (
                          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
                        )`,
                        [
                            'PR', // Fixo PR
                            parseInt(cod),
                            saleDateObj,
                            row[2] ? String(row[2]) : 'SEM MARCA',
                            row[3] ? String(row[3]) : '',
                            parseInt(row[4]) || 0,
                            row[5] ? String(row[5]) : '',
                            row[6] ? String(row[6]) : '',
                            row[7] ? String(row[7]) : '',
                            row[8] ? String(row[8]) : '',
                            row[9] ? String(row[9]) : '',
                            parseFloat(row[10]) || 0, // Venda unit.
                            parseFloat(row[11]) || 0, // Qtd
                            parseFloat(row[12]) || 0, // Custo Unit.
                            parseFloat(row[14]) || 0, // Venda Total (Col O)
                            liters,
                            row[28] ? String(row[28]) : 'UN',
                            refMonth,
                            refYear
                        ]
                    );
                    salesCount++;
                }
            }
        }

        console.log('🔄 Calculando e persistindo comissões estáticas no banco de dados...');
        await poolAnalitico.query(`
            UPDATE sales_transactions s
            SET 
                salesperson_comm_pct = c.salesperson_comm_pct,
                salesperson_comm_rs = (COALESCE(s.total_sale_raw, s.unit_price * s.quantity) * COALESCE(c.salesperson_comm_pct, 0.01))
            FROM brand_configs c
            WHERE s.brand = c.brand
        `);

        console.log(`✅ Seed concluído com sucesso para o PR! Inseridas ${salesCount} transações.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante o seed:', error);
        process.exit(1);
    }
}

runSeed();
