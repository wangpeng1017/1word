-- ========================================
-- 多词性多释义支持
-- ========================================

-- 创建 word_meanings 表
CREATE TABLE IF NOT EXISTS word_meanings (
  id VARCHAR(255) PRIMARY KEY,
  vocabulary_id VARCHAR(255) NOT NULL,
  part_of_speech VARCHAR(50) NOT NULL,  -- 词性: n., v., adj., adv., prep., conj., pron., etc.
  meaning TEXT NOT NULL,                 -- 该词性下的释义
  order_index INT DEFAULT 0,             -- 显示顺序
  examples TEXT[],                       -- 例句数组（可选）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_vocabulary
    FOREIGN KEY (vocabulary_id)
    REFERENCES vocabularies(id)
    ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_word_meanings_vocabulary 
  ON word_meanings(vocabulary_id);

CREATE INDEX IF NOT EXISTS idx_word_meanings_pos 
  ON word_meanings(part_of_speech);

CREATE INDEX IF NOT EXISTS idx_word_meanings_vocab_order 
  ON word_meanings(vocabulary_id, order_index);

-- 注释
COMMENT ON TABLE word_meanings IS '单词多词性多释义表';
COMMENT ON COLUMN word_meanings.part_of_speech IS '词性：n.名词 v.动词 adj.形容词 adv.副词 prep.介词 conj.连词 pron.代词等';
COMMENT ON COLUMN word_meanings.meaning IS '该词性下的中文释义';
COMMENT ON COLUMN word_meanings.order_index IS '显示顺序，数字越小越靠前';
COMMENT ON COLUMN word_meanings.examples IS '例句数组';

-- 迁移现有数据（如果有）
-- 将现有 vocabularies 表的 primary_meaning 和 secondary_meaning 迁移到新表
INSERT INTO word_meanings (id, vocabulary_id, part_of_speech, meaning, order_index, created_at, updated_at)
SELECT 
  'wm_' || v.id || '_0' as id,
  v.id as vocabulary_id,
  COALESCE(v.part_of_speech[1], 'n.') as part_of_speech,
  v.primary_meaning as meaning,
  0 as order_index,
  v.created_at,
  v.updated_at
FROM vocabularies v
WHERE v.primary_meaning IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM word_meanings wm WHERE wm.vocabulary_id = v.id
);

-- 如果有 secondary_meaning，也迁移
INSERT INTO word_meanings (id, vocabulary_id, part_of_speech, meaning, order_index, created_at, updated_at)
SELECT 
  'wm_' || v.id || '_1' as id,
  v.id as vocabulary_id,
  COALESCE(v.part_of_speech[2], v.part_of_speech[1], 'n.') as part_of_speech,
  v.secondary_meaning as meaning,
  1 as order_index,
  v.created_at,
  v.updated_at
FROM vocabularies v
WHERE v.secondary_meaning IS NOT NULL
AND v.secondary_meaning != ''
AND NOT EXISTS (
  SELECT 1 FROM word_meanings wm 
  WHERE wm.vocabulary_id = v.id 
  AND wm.order_index = 1
);

ANALYZE word_meanings;
