import ExcelJS from 'exceljs';

async function run() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('./reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx');
        const ws = workbook.getWorksheet('Jan 25 A');

        console.log("== Analisando Jan 25 A ==");

        [3, 4, 13, 19].forEach(i => {
            const row = ws.getRow(i);
            const rowData = [];
            row.eachCell((cell, colNumber) => {
                if (cell.type === ExcelJS.ValueType.Formula) {
                    rowData.push(`[C${colNumber}] F: ${cell.result || cell.value} (${cell.formula})`);
                } else if (cell.type === ExcelJS.ValueType.Number) {
                    rowData.push(`[C${colNumber}] N: ${cell.value}`);
                } else {
                    rowData.push(`[C${colNumber}] S: ${cell.value}`);
                }
            });
            console.log(`Row ${i}:`, rowData);
        });
    } catch (e) {
        console.error(e);
    }
}
run();
