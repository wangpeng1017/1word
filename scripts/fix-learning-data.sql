-- Fix completion rate > 100% bug (Bug 3 legacy data)
-- Sets completedWords to totalWords, and strictly caps correctCount to totalWords.
-- Recalculates wrongCount to maintain consistency.

START TRANSACTION;

UPDATE study_records
SET 
  completedWords = totalWords,
  correctCount = totalWords,
  wrongCount = 0,
  accuracy = 1.0
WHERE completedWords > totalWords;

COMMIT;

-- Verify results
SELECT id, studentId, taskDate, totalWords, completedWords, correctCount, wrongCount 
FROM study_records 
WHERE studentId = 'stu_2_1766671236.329257'
ORDER BY createdAt DESC 
LIMIT 5;
