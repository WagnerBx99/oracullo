import { poolAnalitico } from '../config/databases.js';
import * as xlsx from 'xlsx';
import fs from 'fs';

async function runMigration() {
    console.log('🚀 Iniciando script de criação e população da coluna check_column...');

    try {
        // 1. Criar a coluna
        console.log('1. Criando coluna check_column na tabela sales_transactions, se não existir...');
        await poolAnalitico.query(`
            ALTER TABLE sales_transactions 
            ADD COLUMN IF NOT EXISTS check_column NUMERIC(15,4);
        `);
        console.log('✅ Coluna adicionada (ou já existia).');

        // 2. Lendo arquivo excel do Paraná
        const filePath = '/Users/cason/Projects/cason_oracullo/reports/2. Faturamento - 2025 - Paraná.xlsx';
        if (!fs.existsSync(filePath)) {
            console.error('❌ Arquivo Excel não encontrado:', filePath);
            process.exit(1);
        }

        console.log('2. Lendo abas de vendas do Excel para atualizar check_column...');
        const buf = fs.readFileSync(filePath);
        const workbook = xlsx.read(buf, { type: 'buffer' });

        const bSheets = workbook.SheetNames.filter(n => n.trim().endsWith(' B'));
        console.log('Abas de Vendas localizadas:', bSheets);

        let updateCount = 0;

        for (const sheetName of bSheets) {
            console.log(`📝 Processando Aba: ${sheetName}...`);
            const dataSales = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, range: 3 });

            const queries = [];
            for (const row of dataSales) {
                const cod = row[0]; // Cód Produto
                const nf = row[4];  // NF
                const checkValue = parseFloat(row[21]); // Conferência é IDX 21 na aba 'B'

                if (cod && !isNaN(parseFloat(cod)) && nf && !isNaN(parseFloat(nf)) && !isNaN(checkValue)) {
                    // Update usando produto e NF como chaves
                    queries.push(
                        poolAnalitico.query(
                            `UPDATE sales_transactions 
                             SET check_column = $1 
                             WHERE product_code = $2 AND invoice_number = $3 
                             AND state = 'PR' AND check_column IS NULL`,
                            [checkValue, parseInt(cod), parseInt(nf)]
                        )
                    );
                }
            }

            // Executando as promises da aba em paralelo
            if (queries.length > 0) {
                await Promise.all(queries);
                updateCount += queries.length;
                console.log(`✅ Aba ${sheetName} processada. Updates agendados: ${queries.length}`);
            }
        }

        // 3. Fallback: Qualquer linha que ainda estiver nula recebe o valor do Custo Unitário (como era espelhado antes)
        console.log('3. Realizando fallback para linhas sem match no Excel (check_column = unit_cost)...');
        const fallbackRes = await poolAnalitico.query(`
            UPDATE sales_transactions
            SET check_column = unit_cost
            WHERE check_column IS NULL
                            `);
        console.log(`✅ Fallback aplicado em ${fallbackRes.rowCount} registros(se houvesse).`);

        console.log(`🎉 Migração de check_column concluída com sucesso! Totais de Updates tentados no Excel: ${updateCount}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        process.exit(1);
    }
}

runMigration();
