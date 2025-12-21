// 调试：检查学生班级和计划分配情况
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const studentNos = ['10005', '10010'];

    console.log('='.repeat(80));
    console.log('调试：学生班级和计划分配检查');
    console.log('='.repeat(80));

    // 先列出所有活跃的班级计划
    console.log('\n【所有班级计划】');
    const allPlanClasses = await prisma.plan_classes.findMany({
        include: {
            classes: { select: { id: true, name: true } },
            vocabulary_packs: { select: { id: true, name: true, totalDays: true } }
        }
    });

    allPlanClasses.forEach(pc => {
        console.log('  班级:', pc.classes?.name, '(ID:', pc.class_id + ')');
        console.log('    词汇库:', pc.vocabulary_packs?.name);
        console.log('    开始日期:', pc.start_date?.toISOString().split('T')[0]);
        console.log('    状态:', pc.status);
        console.log('');
    });

    // 检查学生信息
    console.log('【学生班级信息】');
    for (const studentNo of studentNos) {
        const student = await prisma.students.findFirst({
            where: { student_no: studentNo },
            include: {
                classes: { select: { id: true, name: true } },
                user: { select: { name: true } }
            }
        });

        if (!student) {
            console.log('学生 ' + studentNo + ' 不存在');
            continue;
        }

        console.log('学号:', studentNo);
        console.log('  姓名:', student.user?.name);
        console.log('  班级ID:', student.class_id);
        console.log('  班级名称:', student.classes?.name);

        // 检查该学生班级是否有计划
        const planClass = await prisma.plan_classes.findFirst({
            where: {
                class_id: student.class_id,
                status: 'ACTIVE'
            },
            include: {
                vocabulary_packs: { select: { name: true } }
            }
        });

        if (planClass) {
            console.log('  班级计划: 有 (' + planClass.vocabulary_packs?.name + ')');
        } else {
            console.log('  班级计划: 无活跃计划!');
        }

        // 检查学习记录
        const studyPlansCount = await prisma.study_plans.count({
            where: { studentId: student.id }
        });
        console.log('  学习计划数:', studyPlansCount);

        // 检查今日学习记录
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const studyRecordsToday = await prisma.study_records.count({
            where: {
                studentId: student.id,
                createdAt: { gte: today }
            }
        });
        console.log('  今日学习记录:', studyRecordsToday);

        console.log('');
    }

    // 打印所有班级
    console.log('【所有班级列表】');
    const allClasses = await prisma.classes.findMany({
        select: { id: true, name: true }
    });
    allClasses.forEach(c => {
        console.log('  ID:', c.id, '| 名称:', c.name);
    });

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
