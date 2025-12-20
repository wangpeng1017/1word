/**
 * 数据库迁移脚本 - 处理枚举类型变更
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始数据库迁移...\n')

  // 1. 删除 plan_classes 表的旧列和约束
  console.log('1. 重建 plan_classes 表...')
  await prisma.$executeRawUnsafe(`
    DROP TABLE IF EXISTS plan_classes CASCADE;
  `)
  console.log('✓ plan_classes 表已删除')

  // 2. 删除 study_plans 表
  console.log('2. 重建 study_plans 表...')
  await prisma.$executeRawUnsafe(`
    DROP TABLE IF EXISTS study_plans CASCADE;
  `)
  console.log('✓ study_plans 表已删除')

  // 3. 删除旧的枚举类型
  console.log('3. 清理旧枚举类型...')
  try {
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "StudyPlanStatus" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "StudyPlanStatus_old" CASCADE;`)
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PlanClassStatus" CASCADE;`)
    console.log('✓ 旧枚举类型已清理')
  } catch (e) {
    console.log('枚举类型清理跳过:', e.message)
  }

  // 4. 创建新的枚举类型
  console.log('4. 创建新枚举类型...')
  await prisma.$executeRawUnsafe(`
    CREATE TYPE "StudyPlanStatus" AS ENUM ('LEARNING', 'MASTERED');
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TYPE "PlanClassStatus" AS ENUM ('ACTIVE', 'COMPLETED');
  `)
  console.log('✓ 新枚举类型已创建')

  // 5. 创建新的 plan_classes 表
  console.log('5. 创建新 plan_classes 表...')
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "plan_classes" (
      "id" TEXT NOT NULL,
      "class_id" TEXT NOT NULL,
      "pack_id" TEXT NOT NULL,
      "status" "PlanClassStatus" NOT NULL DEFAULT 'ACTIVE',
      "start_date" DATE NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "plan_classes_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX "plan_classes_class_id_pack_id_key" ON "plan_classes"("class_id", "pack_id");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX "plan_classes_class_id_idx" ON "plan_classes"("class_id");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX "plan_classes_status_idx" ON "plan_classes"("status");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX "plan_classes_pack_id_idx" ON "plan_classes"("pack_id");
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "plan_classes" ADD CONSTRAINT "plan_classes_class_id_fkey"
    FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "plan_classes" ADD CONSTRAINT "plan_classes_pack_id_fkey"
    FOREIGN KEY ("pack_id") REFERENCES "vocabulary_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  `)
  console.log('✓ plan_classes 表已创建')

  // 6. 创建新的 study_plans 表
  console.log('6. 创建新 study_plans 表...')
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "study_plans" (
      "id" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "vocabularyId" TEXT NOT NULL,
      "status" "StudyPlanStatus" NOT NULL DEFAULT 'LEARNING',
      "reviewCount" INTEGER NOT NULL DEFAULT 0,
      "lastReviewAt" TIMESTAMP(3),
      "nextReviewAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX "study_plans_studentId_vocabularyId_key" ON "study_plans"("studentId", "vocabularyId");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX "study_plans_studentId_status_idx" ON "study_plans"("studentId", "status");
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX "study_plans_studentId_nextReviewAt_idx" ON "study_plans"("studentId", "nextReviewAt");
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_vocabularyId_fkey"
    FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  `)
  console.log('✓ study_plans 表已创建')

  console.log('\n数据库迁移完成!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
