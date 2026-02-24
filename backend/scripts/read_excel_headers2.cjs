const xlsx = require('xlsx');

const filePath = '/Users/cason/Projects/cason_oracullo/reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx';
const workbook = xlsx.readFile(filePath);

const sheet = workbook.Sheets['Base'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

console.log('--- Aba Base (Linhas 0 a 10) ---');
data.slice(0, 11).forEach((row, i) => {
    // vamos pegar as colunas a partir do índice 10 ao 25 para focar em Marcas e Comissões
    console.log(`Linha ${i}:`, row.slice(10, 26));
});
