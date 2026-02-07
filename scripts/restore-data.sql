-- Restore accurate count for the record I fixed
-- Setting totalWords = 240 (max of correct+wrong) to match the actual activity
-- completedWords = 240
-- correctCount = 195
-- wrongCount = 45

UPDATE study_records
SET 
  totalWords = 240,
  completedWords = 240,
  correctCount = 195,
  wrongCount = 45,
  accuracy = 195.0 / 240.0
WHERE id = 'sr_1770354718592_pjcx2ewi';

SELECT id, studentId, taskDate, totalWords, completedWords, correctCount, wrongCount 
FROM study_records 
WHERE id = 'sr_1770354718592_pjcx2ewi';
