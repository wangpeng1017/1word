-- 智能词汇复习助手 - 完整数据库初始化脚本
-- 在Vercel Postgres Query界面执行此脚本

-- 1. 创建枚举类型
CREATE TYPE "UserRole" AS ENUM ('TEACHER', 'STUDENT');
CREATE TYPE "WordDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "QuestionType" AS ENUM ('ENGLISH_TO_CHINESE', 'CHINESE_TO_ENGLISH', 'LISTENING', 'FILL_IN_BLANK');
CREATE TYPE "StudyPlanStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MASTERED');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'INTERRUPTED');

-- 2. 删除现有表（如果存在）
DROP TABLE IF EXISTS word_masteries CASCADE;
DROP TABLE IF EXISTS wrong_questions CASCADE;
DROP TABLE IF EXISTS study_records CASCADE;
DROP TABLE IF EXISTS daily_tasks CASCADE;
DROP TABLE IF EXISTS study_plans CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS word_images CASCADE;
DROP TABLE IF EXISTS word_audios CASCADE;
DROP TABLE IF EXISTS vocabularies CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_configs CASCADE;

-- 3. 创建users表
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'STUDENT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. 创建teachers表
CREATE TABLE teachers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  school TEXT,
  subject TEXT DEFAULT '英语',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. 创建classes表
CREATE TABLE classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. 创建students表
CREATE TABLE students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_no TEXT NOT NULL UNIQUE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  grade TEXT,
  wechat_id TEXT UNIQUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. 创建vocabularies表
CREATE TABLE vocabularies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  word TEXT NOT NULL UNIQUE,
  part_of_speech TEXT[] NOT NULL,
  primary_meaning TEXT NOT NULL,
  secondary_meaning TEXT,
  phonetic TEXT,
  phonetic_us TEXT,
  phonetic_uk TEXT,
  is_high_frequency BOOLEAN NOT NULL DEFAULT false,
  difficulty "WordDifficulty" NOT NULL DEFAULT 'MEDIUM',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. 创建system_configs表
CREATE TABLE system_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 验证创建结果
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
