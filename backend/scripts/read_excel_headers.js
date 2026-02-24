import * as XLSX from 'xlsx';

const filePath = '/Users/cason/Projects/cason_oracullo/reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx';
// Correção ESM para xlsx
const workbook = XLSX.readFile(filePath);

console.log('Planilhas disponíveis:', workbook.SheetNames);

const sheetsToInspect = ['Jan 25 B', 'Base', 'Produtos Embalagem'];

sheetsToInspect.forEach(sheetName => {
    if (workbook.SheetNames.includes(sheetName)) {
        console.log(`\n--- Primeiras linhas da aba: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });
        console.log(data.slice(0, 3));
    } else {
        console.log(`\n ABA NÃO ENCONTRADA: ${sheetName}`);
    }
});
