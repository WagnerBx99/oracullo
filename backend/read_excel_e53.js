const ExcelJS = require('exceljs');

async function run() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('./reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx');
        const ws = workbook.getWorksheet('Jan 25 A');
        
        console.log("== Analisando E53 em Jan 25 A ==");
        const row53 = ws.getRow(53);
        const rowData = [];
        row53.eachCell((cell, colNumber) => {
            if (cell.type === ExcelJS.ValueType.Formula) {
                rowData.push(`[C${colNumber}] F: ${cell.result || cell.value} (${cell.formula})`);
            } else {
                rowData.push(`[C${colNumber}] ${cell.value}`);
            }
        });
        console.log(rowData);
    } catch(e) {
        console.error(e);
    }
}
run();
