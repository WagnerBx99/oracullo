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
    console.log('🌱 Iniciando Seed de Faturamento...');

    const filePath = '/Users/cason/Projects/cason_oracullo/reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx';
    const buf = fs.readFileSync(filePath);
    const workbook = xlsx.read(buf, { type: 'buffer' });

    try {
        // 1. Limpar tabelas no banco analítico
        console.log('🧹 Limpando tabelas antigas...');
        await poolAnalitico.query('DELETE FROM sales_transactions');
        await poolAnalitico.query('DELETE FROM brand_configs');
        await poolAnalitico.query('DELETE FROM products_packaging');

        // 2. Extrair e Inserir products_packaging
        console.log('📦 Inserindo Embalagens (Produtos Embalagem)...');
        const sheetEmbalagem = workbook.Sheets['Produtos Embalagem'];
        const dataEmbalagem = xlsx.utils.sheet_to_json(sheetEmbalagem, { header: 1, range: 1 }); // Pula cabeçalho linha 1

        const addedProducts = new Set();
        for (const row of dataEmbalagem) {
            // Verifica se tem conteúdo e se é um código válido (numérico)
            if (row[0] && !isNaN(parseInt(row[0]))) {
                const cod = parseInt(row[0]);
                if (!addedProducts.has(cod)) {
                    const numVolume = parseFloat(row[3]);
                    const volumeFinal = isNaN(numVolume) ? 1 : numVolume;

                    await poolAnalitico.query(
                        `INSERT INTO products_packaging (product_code, product_name, package_type, unit_volume) 
               VALUES ($1, $2, $3, $4)`,
                        [cod, row[1], row[2], volumeFinal]
                    );
                    addedProducts.add(cod);
                }
            }
        }

        // 3. Extrair percentual operacional por marca da sheet 'Jan 25 B'
        console.log('🏷️ Extraindo Configurações de Marcas (Base e Jan 25 B)...');
        const sheetSalesForConfig = workbook.Sheets['Jan 25 B'];
        const dataSalesForConfig = xlsx.utils.sheet_to_json(sheetSalesForConfig, { header: 1, range: 3 });

        // Map temporário para pegar o operational_cost_pct (coluna X = 23) agrupado pela marca (coluna D = 3) da Jan 25 B
        const opCostByBrand = {};
        for (const row of dataSalesForConfig) {
            const tempBrand = row[3];
            const tempOpCost = parseFloat(row[23]); // coluna X
            if (tempBrand && !isNaN(tempOpCost)) {
                opCostByBrand[tempBrand] = tempOpCost;
            }
        }

        // 4. Inserir brand_configs cruzando com a aba 'Base'
        const sheetBase = workbook.Sheets['Base'];
        const dataBase = xlsx.utils.sheet_to_json(sheetBase, { header: 1, range: 2 });

        const brandsAdded = new Set();
        for (const row of dataBase) {
            const brand = row[13]; // coluna N
            const commVendedor = parseFloat(row[14]); // coluna O
            const commInterna = parseFloat(row[15]);  // coluna P

            if (brand && typeof brand === 'string' && !brandsAdded.has(brand)) {

                // Se o commVendedor não for um número válido retornado na base, tenta default 0.01
                const finalCommV = isNaN(commVendedor) ? 0.01 : commVendedor;
                // Se commInterna não for um número válido retornado na base, tenta default 0.005
                const finalCommI = isNaN(commInterna) ? 0.005 : commInterna;

                // Busca o op_cost cruzado da aba vendas
                const finalOpCost = typeof opCostByBrand[brand] !== 'undefined' ? opCostByBrand[brand] : 0.2085;

                await poolAnalitico.query(
                    `INSERT INTO brand_configs (brand, operational_cost_pct, salesperson_comm_pct, internal_comm_pct, manager_comm_pct)
           VALUES ($1, $2, $3, $4, $5)`,
                    [brand, finalOpCost, finalCommV, finalCommI, 0.01]
                );
                brandsAdded.add(brand);
            }
        }

        // 4. Extrair e Selecionar as Linhas Válidas da Planilha
        console.log('💰 Extraindo Transações de Venda (Jan 25 B)...');
        const sheetSales = workbook.Sheets['Jan 25 B'];
        const dataSales = xlsx.utils.sheet_to_json(sheetSales, { header: 1, range: 3 }); // Pula cabeçalhos

        const validRows = [];
        for (const row of dataSales) {
            const cod = row[1];
            if (cod && !isNaN(parseFloat(cod)) && String(cod).trim() !== '') {
                validRows.push(row);
            }
        }

        console.log(`Encontradas ${validRows.length} linhas originais no arquivo.`);

        // O usuário solicitou 50 transações no mínimo. 
        // Como a base só tem ~8 registradas, vamos ciclar por essas válidas para criar 50 inserts:
        let salesCount = 0;
        const TOTAL_MOCK_TARGET = 50;

        console.log(`Gerando mocks a partir da base original até alcançar ${TOTAL_MOCK_TARGET} transações...`);

        while (salesCount < TOTAL_MOCK_TARGET && validRows.length > 0) {
            const originalRowIndex = salesCount % validRows.length;
            const row = validRows[originalRowIndex];
            const cod = row[1];

            const saleDateObj = excelDateToJSDate(row[2]);
            if (!saleDateObj) {
                // Ignora se não houver data, mas avança contador para evitar loop infinito na mesma row se todas fossem invalidas
                console.log(`Skipping row without date...`);
                salesCount++;
                continue;
            }

            const refYear = parseInt(saleDateObj.split('-')[0]);
            const refMonth = parseInt(saleDateObj.split('-')[1]);

            const liters = parseFloat(row[16]) || 0;

            // Inserir registro
            await poolAnalitico.query(
                `INSERT INTO sales_transactions (
          state, product_code, sale_date, brand, subgroup, invoice_number,
          client_name, branch, salesperson, payment_term, product,
          unit_price, quantity, unit_cost, liters_qty, packaging_type,
          ref_month, ref_year
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )`,
                [
                    'SP', // Fixo
                    parseInt(cod),
                    saleDateObj,
                    row[3] ? String(row[3]) : 'SEM MARCA',
                    row[4] ? String(row[4]) : '',
                    parseInt(row[5]) || 0,
                    row[6] ? String(row[6]) : '',
                    row[7] ? String(row[7]) : '',
                    row[8] ? String(row[8]) : '',
                    row[9] ? String(row[9]) : '',
                    row[10] ? String(row[10]) : '',
                    parseFloat(row[11]) || 0,
                    parseFloat(row[12]) || 0,
                    parseFloat(row[13]) || 0,
                    liters,
                    row[28] ? String(row[28]) : 'UN', // Coluna 28 é Embalagem
                    refMonth,
                    refYear
                ]
            );
            salesCount++;
        }
        console.log(`✅ Seed concluído com sucesso! Inseridas ${salesCount} transações.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante o seed:', error);
        process.exit(1);
    }
}

runSeed();
