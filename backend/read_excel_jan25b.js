import ExcelJS from 'exceljs';

async function run() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('./reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx');
        const ws = workbook.getWorksheet('Jan 25 B');

        console.log("== Lendo Linha 4 Literal ==");
        const row = ws.getRow(4);
        const vals = [];
        row.eachCell((cell, colNumber) => {
            const letter = ws.getColumn(colNumber).letter;
            let val = cell.value;
            if (cell.type === ExcelJS.ValueType.Formula) {
                val = cell.result;
            }
            vals.push(`[${letter}] ${val}`);
        });
        console.log(`Linha 4:`, vals.join(' | '));

    } catch (e) {
        console.error(e);
    }
}
run();
