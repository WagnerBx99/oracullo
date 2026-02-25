import ExcelJS from 'exceljs';

async function run() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('../reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx');
        const ws = workbook.getWorksheet('Jan 25 A');

        // Vamos extrair as linhas da "Jan 25 A" da linha 3 até 20
        console.log("== Analisando Jan 25 A ==");
        for (let i = 3; i <= 20; i++) {
            const row = ws.getRow(i);
            const rowData = [];
            row.eachCell((cell, colNumber) => {
                if (cell.type === ExcelJS.ValueType.Formula) {
                    rowData.push(`[Col ${colNumber}] FORMULA: ${cell.formula} / Result: ${cell.result}`);
                } else if (cell.type === ExcelJS.ValueType.Number) {
                    rowData.push(`[Col ${colNumber}] NUM: ${cell.value}`);
                } else {
                    rowData.push(`[Col ${colNumber}] STR: ${cell.value}`);
                }
            });
            if (rowData.length > 0) {
                console.log(`Row ${i}:`, rowData);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
