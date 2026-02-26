import ExcelJS from 'exceljs';

async function analyze() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('/Users/cason/Projects/cason_oracullo/reports/8. Faturamento Diário Resumido - 2025 - Copia.xlsx');
    
    const sheet = workbook.getWorksheet('Jan 25'); // without B
    if (!sheet) {
        console.log("Sheet 'Jan 25' not found");
        return;
    }

    console.log("Sheet dimensions:", sheet.dimensions);
    
    // We want to find the consolidation section. Usually it's at the end of the sheet or specific columns.
    // Let's print the first 50 rows, but just columns A to G, to see the structure.
    for (let i = 1; i <= 50; i++) {
        const row = sheet.getRow(i);
        const values = [];
        for (let j = 1; j <= 10; j++) {
            values.push(row.getCell(j).text);
        }
        if (values.some(v => v !== '')) {
            console.log(`Row ${i}:`, JSON.stringify(values));
        }
    }

    console.log("\n--- Searching for 'RESUMO' or 'CONSOLIDADO' ---");
    // Search the whole sheet for keywords
    let found = false;
    sheet.eachRow((row, rowNumber) => {
        const rowVals = row.values;
        if (rowVals && rowVals.some(v => typeof v === 'string' && (v.toUpperCase().includes('RESUMO') || v.toUpperCase().includes('TOTAL FILIAL')))) {
            console.log(`Found keyword at Row ${rowNumber}:`, row.values.slice(1, 15));
            found = true;
        }
    });

    if (!found) {
        console.log("No explicit summary rows found with standard keywords.");
    }
}

analyze().catch(console.error);
