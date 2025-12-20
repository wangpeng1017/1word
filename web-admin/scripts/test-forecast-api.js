// Test forecast API - Review plan prediction
require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testForecastAPI() {
  console.log('=== Review Forecast API Test ===');
  console.log('');

  // 1. Find test student
  const student = await prisma.students.findFirst({
    where: { student_no: '10001' },
    select: { id: true, student_no: true }
  });

  if (!student) {
    console.log('ERROR: Student 10001 not found');
    return;
  }

  console.log('Student found:', student.student_no, '(ID:', student.id, ')');
  console.log('');

  // 2. Get study plan statistics
  const [totalPlans, masteredPlans, pendingPlans] = await Promise.all([
    prisma.study_plans.count({ where: { studentId: student.id } }),
    prisma.study_plans.count({ where: { studentId: student.id, status: 'MASTERED' } }),
    prisma.study_plans.count({ where: { studentId: student.id, status: { not: 'MASTERED' } } }),
  ]);

  console.log('Study Plan Statistics:');
  console.log('  Total learned:', totalPlans);
  console.log('  Mastered:', masteredPlans);
  console.log('  In review pool:', pendingPlans);
  console.log('  Mastery rate:', totalPlans > 0 ? Math.round((masteredPlans / totalPlans) * 100) + '%' : '0%');
  console.log('');

  // 3. Calculate 30-day forecast (extended to see future reviews)
  const plans = await prisma.study_plans.findMany({
    where: { studentId: student.id, status: { not: 'MASTERED' } },
    select: { nextReviewAt: true, reviewCount: true }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('30-Day Review Forecast:');
  for (let i = 0; i < 30; i++) {
    const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    const count = plans.filter(p => p.nextReviewAt && new Date(p.nextReviewAt) <= targetDate).length;
    if (count > 0 || i < 7) {
      const difficulty = count > 300 ? 'HEAVY' : count > 150 ? 'NORMAL' : 'LIGHT';
      const dateStr = targetDate.toISOString().slice(0, 10);
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day ' + (i + 1);
      console.log('  ' + dayLabel.padEnd(10) + ' (' + dateStr + '): ' + String(count).padStart(4) + ' words [' + difficulty + ']');
    }
  }

  // Show next review dates distribution
  console.log('');
  console.log('Next Review Dates Distribution:');
  const dateCount = {};
  plans.forEach(p => {
    if (p.nextReviewAt) {
      const dateStr = p.nextReviewAt.toISOString().slice(0, 10);
      dateCount[dateStr] = (dateCount[dateStr] || 0) + 1;
    }
  });
  Object.entries(dateCount).sort().forEach(([date, count]) => {
    console.log('  ' + date + ': ' + count + ' words');
  });

  console.log('');
  console.log('Test completed successfully!');
}

testForecastAPI()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
