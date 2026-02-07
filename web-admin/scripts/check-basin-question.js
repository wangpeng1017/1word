const mammoth = require('mammoth');
const path = require('path');

async function checkBasinQuestion() {
    const filePath = path.join('E:', 'trae', '1word', '练习', '第1-200个.docx');
    console.log('Reading:', filePath);

    const result = await mammoth.extractRawText({ path: filePath });
    const lines = result.value.split('\n').map(l => l.trim()).filter(l => l);

    const basinIndex = lines.findIndex(l => l.toLowerCase().includes('basin'));

    if (basinIndex === -1) {
        console.log('basin not found');
        return;
    }

    console.log('\n=== basin 附近的内容 ===\n');
    const start = Math.max(0, basinIndex - 3);
    const end = Math.min(lines.length, basinIndex + 15);

    for (let i = start; i < end; i++) {
        const marker = i === basinIndex ? ' <-- basin' : '';
        console.log(`${i}: ${lines[i]}${marker}`);
    }
}

checkBasinQuestion().catch(console.error);
