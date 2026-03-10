const ExcelJS = require('exceljs');
const fs = require('fs');

async function main() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('e:/trae/1word/docs/90天复习全流程.xlsx');

    const ws = wb.worksheets[0];
    let output = `Sheet: ${ws.name}, rows: ${ws.rowCount}, cols: ${ws.columnCount}\n\n`;

    for (let r = 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const vals = [];
        for (let c = 1; c <= ws.columnCount; c++) {
            const cell = row.getCell(c);
            const v = cell.value;
            if (v && typeof v === 'object' && v.richText) {
                vals.push(v.richText.map(t => t.text).join(''));
            } else {
                vals.push(v !== null && v !== undefined ? String(v) : '');
            }
        }
        output += `Row${r}: ${vals.join(' | ')}\n`;
    }

    fs.writeFileSync('e:/trae/1word/docs/90天复习全流程_parsed.txt', output, 'utf8');
    console.log('Done! Written to 90天复习全流程_parsed.txt');
}

main().catch(console.error);
