// 创建枚举类型的SQL（需要先执行）
export const createEnumsSQLArray = [
  `CREATE TYPE "UserRole" AS ENUM ('TEACHER', 'STUDENT')`,
  `CREATE TYPE "WordDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD')`,
]

// 创建所有数据库表的SQL语句数组（每条语句单独执行）
export const createTablesSQLArray = [
  
  // Users table
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone")`,
  
  // Teachers table
  `CREATE TABLE IF NOT EXISTS "teachers" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "school" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE UNIQUE INDEX IF NOT EXISTS "teachers_user_id_key" ON "teachers"("user_id")`,
  
  // Students table
  `CREATE TABLE IF NOT EXISTS "students" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "student_no" TEXT NOT NULL,
    "class_id" TEXT,
    "grade" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE UNIQUE INDEX IF NOT EXISTS "students_user_id_key" ON "students"("user_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "students_student_no_key" ON "students"("student_no")`,
  
  // Classes table
  `CREATE TABLE IF NOT EXISTS "classes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  // Vocabularies table
  `CREATE TABLE IF NOT EXISTS "vocabularies" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "word" TEXT NOT NULL,
    "part_of_speech" TEXT[] NOT NULL,
    "primary_meaning" TEXT NOT NULL,
    "secondary_meaning" TEXT,
    "phonetic" TEXT,
    "phonetic_us" TEXT,
    "phonetic_uk" TEXT,
    "is_high_frequency" BOOLEAN NOT NULL DEFAULT false,
    "difficulty" "WordDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE UNIQUE INDEX IF NOT EXISTS "vocabularies_word_key" ON "vocabularies"("word")`,
]

// 添加外键约束的SQL（需要在表创建后执行）
export const addForeignKeysSQLArray = [
  `DO $$ 
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_user_id_fkey') THEN
       ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" 
         FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     END IF;
   END $$`,
   
  `DO $$ 
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_user_id_fkey') THEN
       ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" 
         FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     END IF;
   END $$`,
   
  `DO $$ 
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_class_id_fkey') THEN
       ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" 
         FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
     END IF;
   END $$`,
   
  `DO $$ 
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_teacher_id_fkey') THEN
       ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" 
         FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
     END IF;
   END $$`,
]
