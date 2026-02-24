const xlsx = require('xlsx');

const filePath = '/Users/cason/Projects/cason_oracullo/reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetSales = workbook.Sheets['Jan 25 B'];
const dataSales = xlsx.utils.sheet_to_json(sheetSales, { header: 1, range: 3 });

let validRows = 0;
dataSales.forEach((row, i) => {
    if (row[1] !== undefined && row[1] !== 'Cód' && row[1] !== null && String(row[1]).trim() !== '') {
        validRows++;
        if (validRows <= 15) {
            console.log(`Valida #${validRows} (Linha ${i}): Cód=${row[1]} Data=${row[2]} Marca=${row[3]}`);
        }
    }
});

console.log(`Total de linhas com Cód válido: ${validRows}`);
