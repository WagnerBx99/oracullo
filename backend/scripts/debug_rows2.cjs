const xlsx = require('xlsx');

const filePath = '/Users/cason/Projects/cason_oracullo/reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetSales = workbook.Sheets['Jan 25 B'];
const dataSales = xlsx.utils.sheet_to_json(sheetSales, { header: 1, range: 3 });

dataSales.forEach((row, i) => {
    if (row[1] !== undefined && row[1] !== 'Cód' && row[1] !== null && String(row[1]).trim() !== '') {
        console.log(`Linha ${i}: Filial="${row[7]}" Vendedor="${row[8]}"`);
    }
});
