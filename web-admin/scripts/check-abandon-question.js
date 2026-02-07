const mammoth = require('mammoth');
const path = require('path');

async function checkAbandonQuestion() {
    const filePath = path.join('E:', 'trae', '1word', '练习', '第1-200个.docx');
    console.log('Reading:', filePath);

    const result = await mammoth.extractRawText({ path: filePath });
    const lines = result.value.split('\n').map(l => l.trim()).filter(l => l);

    // 找 abandon 相关的行
    const abandonIndex = lines.findIndex(l => /^1[\.\s]+abandon/.test(l));

    if (abandonIndex === -1) {
        console.log('abandon not found');
        return;
    }

    console.log('\n=== abandon 题目完整内容 ===\n');
    const start = abandonIndex;
    const end = Math.min(lines.length, abandonIndex + 20);

    for (let i = start; i < end; i++) {
        console.log(`${i}: [${lines[i]}]`);
        if (lines[i].includes('④')) break; // 遇到下一题停止
    }
}

checkAbandonQuestion().catch(console.error);
