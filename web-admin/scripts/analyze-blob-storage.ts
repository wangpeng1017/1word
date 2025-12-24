import { list } from '@vercel/blob';

async function analyzeBlobStorage() {
    console.log('正在连接 Vercel Blob 并获取文件列表...');

    try {
        const { blobs } = await list();

        const totalSize = blobs.reduce((acc, blob) => acc + blob.size, 0);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        const totalSizeGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);

        console.log(`\n=========================================`);
        console.log(`  Vercel Blob 存储分析报告`);
        console.log(`=========================================`);
        console.log(`\n统计信息:`);
        console.log(`- 文件总数: ${blobs.length}`);
        console.log(`- 总占用空间: ${totalSizeMB} MB (${totalSizeGB} GB)`);

        // 检查是否接近 1GB 限制
        const limit = 1024 * 1024 * 1024; // 1GB
        const usagePercent = ((totalSize / limit) * 100).toFixed(1);
        console.log(`- 使用率 (基于 1GB 限制): ${usagePercent}%`);

        if (blobs.length > 0) {
            console.log(`\n文件列表预览 (前 20 个):`);
            // 按大小排序，看大文件
            const sortedBlobs = [...blobs].sort((a, b) => b.size - a.size);

            sortedBlobs.slice(0, 20).forEach((blob, index) => {
                const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
                console.log(`${index + 1}. ${blob.pathname} - ${sizeMB} MB`);
            });

            if (blobs.length > 20) {
                console.log(`\n... 还有 ${blobs.length - 20} 个文件`);
            }

            // 检查 .wav 文件（之前的音频文件）
            const wavFiles = blobs.filter(b => b.pathname.endsWith('.wav') || b.pathname.endsWith('.mp3'));
            if (wavFiles.length > 0) {
                const wavSize = wavFiles.reduce((acc, b) => acc + b.size, 0);
                console.log(`\n⚠️ 发现音频/WAV 文件: ${wavFiles.length} 个, 共 ${(wavSize / 1024 / 1024).toFixed(2)} MB`);
            }

            // 检查 .png 文件
            const pngFiles = blobs.filter(b => b.pathname.endsWith('.png'));
            if (pngFiles.length > 0) {
                const pngSize = pngFiles.reduce((acc, b) => acc + b.size, 0);
                console.log(`\n发现图片/PNG 文件: ${pngFiles.length} 个, 共 ${(pngSize / 1024 / 1024).toFixed(2)} MB`);
            }
        } else {
            console.log('\n存储为空，可以开始上传。');
        }
        console.log(`\n=========================================`);

    } catch (error) {
        console.error('分析失败:', error);
    }
}

if (require.main === module) {
    analyzeBlobStorage();
}

export { analyzeBlobStorage };
