const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();
    try {
        console.log('正在连接数据库...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已配置' : '未配置');
        await prisma.$connect();
        console.log('✅ 数据库连接成功!');

        const userCount = await prisma.user.count();
        console.log('用户数量:', userCount);
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
