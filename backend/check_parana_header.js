import * as xlsx from 'xlsx';
import fs from 'fs';

const filePath = '/Users/cason/Projects/cason_oracullo/reports/2. Faturamento - 2025 - Paraná.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = xlsx.read(buf, { type: 'buffer' });
const firstBSheet = workbook.SheetNames.find(n => n.trim().endsWith(' B'));

if (firstBSheet) {
    const ws = workbook.Sheets[firstBSheet];
    const dataArgs = xlsx.utils.sheet_to_json(ws, { header: 1 });
    // Procura o CABEÇALHO onde estão as colunas Cód Data Marca, possivelmente na linha 1 2 ou 3
    for (let i = 0; i < 4; i++) {
        const row = dataArgs[i] || [];
        console.log(`[Linha ${i}]`, row.map((val, idx) => `[${idx}] ${val}`).join(' | '));
    }
}
