import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phones = searchParams.get('phones')?.split(',') || ['13099990003', '13099990004'];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const results = [];

    for (const phone of phones) {
      // 1. 查找用户
      const user = await prisma.user.findUnique({
        where: { phone }
      });

      if (!user) {
        results.push({
          phone,
          error: '用户不存在'
        });
        continue;
      }

      // 2. 查找学生
      const student = await prisma.students.findUnique({
        where: { user_id: user.id },
        include: {
          classes: true
        }
      });

      if (!student) {
        results.push({
          phone,
          userName: user.name,
          error: '学生信息不存在'
        });
        continue;
      }

      // 3. 查询明天的每日任务
      const dailyTasks = await prisma.daily_tasks.findMany({
        where: {
          studentId: student.id,
          taskDate: tomorrow
        }
      });

      // 4. 查询学习计划（复习任务）
      const studyPlans = await prisma.study_plans.findMany({
        where: {
          studentId: student.id,
          status: 'LEARNING',
          nextReviewAt: {
            gte: new Date(tomorrowStr + 'T00:00:00.000Z'),
            lt: new Date(tomorrowStr + 'T23:59:59.999Z')
          }
        }
      });

      // 按状态分组
      const statusCount = {
        PENDING: dailyTasks.filter(t => t.status === 'PENDING').length,
        IN_PROGRESS: dailyTasks.filter(t => t.status === 'IN_PROGRESS').length,
        COMPLETED: dailyTasks.filter(t => t.status === 'COMPLETED').length,
        INTERRUPTED: dailyTasks.filter(t => t.status === 'INTERRUPTED').length
      };

      const totalWords = dailyTasks.length + studyPlans.length;

      results.push({
        phone,
        userName: user.name,
        studentNo: student.student_no,
        className: student.classes?.name || '未分配',
        tomorrowDate: tomorrowStr,
        dailyTasksCount: dailyTasks.length,
        reviewTasksCount: studyPlans.length,
        totalWords,
        statusCount
      });
    }

    return NextResponse.json({
      success: true,
      date: tomorrowStr,
      results
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
