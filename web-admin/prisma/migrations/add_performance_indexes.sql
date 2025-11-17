-- ========================================
-- 大数据量性能优化索引
-- ========================================

-- Questions表索引优化
CREATE INDEX IF NOT EXISTS idx_questions_vocabulary_type 
  ON questions(vocabularyId, type);

CREATE INDEX IF NOT EXISTS idx_questions_created_at_desc 
  ON questions(createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_questions_type_created 
  ON questions(type, createdAt DESC);

-- Vocabularies表索引优化
CREATE INDEX IF NOT EXISTS idx_vocabularies_word_lower 
  ON vocabularies(LOWER(word));

CREATE INDEX IF NOT EXISTS idx_vocabularies_frequency_difficulty 
  ON vocabularies(is_high_frequency, difficulty);

CREATE INDEX IF NOT EXISTS idx_vocabularies_created_at_desc 
  ON vocabularies(created_at DESC);

-- Students表索引优化
CREATE INDEX IF NOT EXISTS idx_students_class_grade 
  ON students(class_id, grade);

CREATE INDEX IF NOT EXISTS idx_students_created_at_desc 
  ON students(created_at DESC);

-- Study Plans表索引优化
CREATE INDEX IF NOT EXISTS idx_study_plans_student_status 
  ON study_plans(studentId, status);

CREATE INDEX IF NOT EXISTS idx_study_plans_next_review 
  ON study_plans(nextReviewAt) WHERE nextReviewAt IS NOT NULL;

-- Daily Tasks表索引优化
CREATE INDEX IF NOT EXISTS idx_daily_tasks_student_date_status 
  ON daily_tasks(studentId, taskDate, status);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_date_status 
  ON daily_tasks(taskDate, status);

-- Wrong Questions表索引优化
CREATE INDEX IF NOT EXISTS idx_wrong_questions_student_vocab 
  ON wrong_questions(studentId, vocabularyId);

CREATE INDEX IF NOT EXISTS idx_wrong_questions_wrong_at 
  ON wrong_questions(wrongAt DESC);

-- Question Options表索引优化
CREATE INDEX IF NOT EXISTS idx_question_options_question_order 
  ON question_options(questionId, "order");

-- 统计信息更新
ANALYZE questions;
ANALYZE vocabularies;
ANALYZE students;
ANALYZE study_plans;
ANALYZE daily_tasks;
