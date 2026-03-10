const XLSX = require('xlsx');
const fs = require('fs');
const wb = XLSX.readFile('e:/trae/1word/docs/90天复习全流程.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(ws['!ref']);
const lines = [];
for (let R = 0; R <= range.e.r; R++) {
    const cells = [];
    for (let C = 0; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        cells.push(cell ? String(cell.v).replace(/\r?\n/g, ' ').trim() : '-');
    }
    lines.push(`Row${R}: ${cells.join(' | ')}`);
}
fs.writeFileSync('tmp-excel-output.txt', lines.join('\n'), 'utf8');
console.log('Done');
