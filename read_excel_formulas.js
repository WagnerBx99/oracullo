import ExcelJS from 'exceljs';

async function run() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('./reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx');
        const ws = workbook.getWorksheet('Jan 25 A');

        let headerRowIdx = -1;
        ws.eachRow((row, rowNumber) => {
            if (headerRowIdx !== -1) return;
            row.eachCell((cell) => {
                if (cell.value === 'Marca' || cell.value === 'Faturamento') {
                    headerRowIdx = rowNumber;
                }
            });
        });

        if (headerRowIdx !== -1) {
            console.log(`Row ${headerRowIdx} Headers:`, ws.getRow(headerRowIdx).values.filter(Boolean));

            for (let i = headerRowIdx + 1; i <= headerRowIdx + 15; i++) {
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
                console.log(`Row ${i}:`, rowData);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
