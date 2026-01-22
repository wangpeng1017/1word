const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('数据库数据统计\n');
  console.log('='.repeat(60));

  const counts = {
    users: await prisma.user.count(),
    teachers: await prisma.teachers.count(),
    students: await prisma.students.count(),
    classes: await prisma.classes.count(),
    vocabularies: await prisma.vocabularies.count(),
    questions: await prisma.questions.count(),
    study_plans: await prisma.study_plans.count(),
    daily_tasks: await prisma.daily_tasks.count(),
  };

  console.log('\n📊 数据统计:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(20)}: ${count} 条`);
  }

  if (counts.users > 0) {
    console.log('\n👥 所有用户:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    for (const user of users) {
      console.log(`  - ${user.name} (${user.role})`);
      console.log(`    ID: ${user.id}`);
      console.log(`    手机: ${user.phone || '未设置'}`);
      console.log(`    邮箱: ${user.email || '未设置'}`);
      console.log(`    注册时间: ${user.created_at.toLocaleString('zh-CN')}`);
      console.log('');
    }
  }

  if (counts.classes > 0) {
    console.log('\n🏫 所有班级:');
    const classes = await prisma.classes.findMany({
      select: {
        id: true,
        name: true,
        is_active: true,
        created_at: true
      }
    });

    for (const cls of classes) {
      console.log(`  - ${cls.name} (${cls.is_active ? '活跃' : '停用'})`);
    }
  }

  console.log('\n' + '='.repeat(60));

  await prisma.$disconnect();
}

main()
  .catch(console.error);
