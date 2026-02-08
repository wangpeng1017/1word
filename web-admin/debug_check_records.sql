-- 1. Check if a study record already exists for today (This fixes the daily count)
SELECT id, taskDate, totalWords, completedWords, correctCount, wrongCount 
FROM study_records 
WHERE studentId = (SELECT id FROM students WHERE student_no = '10011') 
AND taskDate >= CURDATE();

-- 2. Check the Review Count (Words pending review)
SELECT COUNT(*) as review_count
FROM study_plans 
WHERE studentId = (SELECT id FROM students WHERE student_no = '10011') 
AND status = 'LEARNING' 
AND nextReviewAt <= NOW();

-- 3. Check Plan Start Date and Day Number again
SELECT 
    pc.start_date, 
    CURDATE() as server_today,
    DATEDIFF(CURDATE(), pc.start_date) + 1 as calculated_day_number
FROM plan_classes pc
JOIN students s ON s.class_id = pc.class_id
WHERE s.student_no = '10011' AND pc.status = 'ACTIVE';
