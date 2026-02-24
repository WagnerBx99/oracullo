const xlsx = require('xlsx');

const filePath = '/Users/cason/Projects/cason_oracullo/reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx';
const workbook = xlsx.readFile(filePath);

console.log('Planilhas disponíveis:', workbook.SheetNames);

const sheetsToInspect = ['Jan 25 B', 'Base', 'Produtos Embalagem'];

sheetsToInspect.forEach(sheetName => {
    if (workbook.SheetNames.includes(sheetName)) {
        console.log(`\n--- Primeiras linhas da aba: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });
        console.log(data.slice(0, 3));
    } else {
        console.log(`\n ABA NÃO ENCONTRADA: ${sheetName}`);
    }
});
