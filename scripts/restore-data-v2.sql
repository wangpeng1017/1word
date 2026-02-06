-- Restore record to represent accurate progress against the Total Review Goal (1905)
-- User confirmed: Total = 1905, Completed = 240
-- This fixes the "2400%" issue by setting the correct denominator.

UPDATE study_records
SET 
  totalWords = 1905,
  completedWords = 240,
  correctCount = 195,
  wrongCount = 45,
  accuracy = 195.0 / 240.0
WHERE id = 'sr_1770354718592_pjcx2ewi';

-- Verify results
SELECT id, studentId, taskDate, totalWords, completedWords, correctCount, wrongCount, accuracy 
FROM study_records 
WHERE id = 'sr_1770354718592_pjcx2ewi';
