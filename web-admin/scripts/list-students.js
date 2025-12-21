const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.students.findMany({
        select: {
            id: true,
            student_no: true,
            user: { select: { name: true, phone: true } }
        },
        take: 30
    });

    console.log('数据库中的学生列表:');
    console.log('='.repeat(70));
    students.forEach(x => {
        console.log('ID:', x.id.padEnd(20), '| 学号:', (x.student_no || '').padEnd(10), '| 姓名:', (x.user?.name || '').padEnd(10), '| 手机:', x.user?.phone || '');
    });

    await prisma.$disconnect();
}

main();
