import { list, del } from '@vercel/blob';

async function deleteAllBlobFiles() {
    console.log('开始清理 Vercel Blob 存储...\n');

    try {
        const { blobs } = await list();

        if (blobs.length === 0) {
            console.log('✓ Blob 存储已经是空的，无需清理');
            return;
        }

        const totalSize = blobs.reduce((acc, blob) => acc + blob.size, 0);
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

        console.log(`找到 ${blobs.length} 个文件，总大小 ${totalSizeMB} MB`);
        console.log('开始删除所有文件...\n');

        let deletedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < blobs.length; i++) {
            const blob = blobs[i];
            try {
                await del(blob.url);
                deletedCount++;

                if ((deletedCount % 100 === 0) || (i === blobs.length - 1)) {
                    console.log(`进度: ${deletedCount}/${blobs.length} (${((deletedCount / blobs.length) * 100).toFixed(1)}%)`);
                }
            } catch (error) {
                failedCount++;
                console.error(`删除失败: ${blob.pathname}`);
            }
        }

        console.log(`\n=========================================`);
        console.log(`清理完成！`);
        console.log(`- 成功删除: ${deletedCount} 个文件`);
        console.log(`- 失败: ${failedCount} 个文件`);
        console.log(`- 释放空间: ${totalSizeMB} MB`);
        console.log(`=========================================\n`);
        console.log('提示：等待 5-10 分钟让删除操作完全生效');

    } catch (error) {
        console.error('清理失败:', error);
    }
}

if (require.main === module) {
    deleteAllBlobFiles();
}

export { deleteAllBlobFiles };
