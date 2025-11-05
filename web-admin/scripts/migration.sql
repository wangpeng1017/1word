-- ========================================
-- 学生班级迁移 SQL 脚本
-- 在 Prisma Studio Console 中执行
-- ========================================

-- 步骤 1: 创建默认班级（如果不存在）
-- 首先检查是否已有默认班级
DO $$
DECLARE
    default_class_id TEXT;
    default_teacher_id TEXT;
    default_user_id TEXT;
BEGIN
    -- 检查是否已有"未分配班级"
    SELECT id INTO default_class_id 
    FROM classes 
    WHERE name = '未分配班级' 
    LIMIT 1;
    
    IF default_class_id IS NULL THEN
        -- 获取第一个教师
        SELECT id INTO default_teacher_id 
        FROM teachers 
        LIMIT 1;
        
        -- 如果没有教师，创建默认教师
        IF default_teacher_id IS NULL THEN
            -- 检查是否已有管理员用户
            SELECT id INTO default_user_id 
            FROM users 
            WHERE email = 'admin@default.com';
            
            IF default_user_id IS NULL THEN
                -- 创建管理员用户
                INSERT INTO users (id, email, password, name, role, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), 'admin@default.com', '$2a$10$temp', '系统管理员', 'TEACHER', true, NOW(), NOW())
                RETURNING id INTO default_user_id;
                
                RAISE NOTICE '✅ 创建默认管理员用户: %', default_user_id;
            END IF;
            
            -- 创建默认教师
            INSERT INTO teachers (id, user_id, school, subject, created_at, updated_at)
            VALUES (gen_random_uuid(), default_user_id, '默认学校', '英语', NOW(), NOW())
            RETURNING id INTO default_teacher_id;
            
            RAISE NOTICE '✅ 创建默认教师: %', default_teacher_id;
        END IF;
        
        -- 创建默认班级
        INSERT INTO classes (id, name, grade, teacher_id, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), '未分配班级', '待分配', default_teacher_id, true, NOW(), NOW())
        RETURNING id INTO default_class_id;
        
        RAISE NOTICE '✅ 创建默认班级: %', default_class_id;
    ELSE
        RAISE NOTICE '✅ 默认班级已存在: %', default_class_id;
    END IF;
    
    -- 步骤 2: 更新所有没有班级的学生
    UPDATE students
    SET class_id = default_class_id,
        grade = '待分配',
        updated_at = NOW()
    WHERE class_id IS NULL OR grade IS NULL;
    
    RAISE NOTICE '✅ 学生迁移完成';
END $$;

-- 步骤 3: 验证迁移结果
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN class_id IS NOT NULL THEN 1 END) as students_with_class,
    COUNT(CASE WHEN class_id IS NULL THEN 1 END) as students_without_class
FROM students;

-- 步骤 4: 查看"未分配班级"的学生
SELECT 
    s.student_no,
    u.name as student_name,
    c.name as class_name,
    s.grade
FROM students s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN classes c ON s.class_id = c.id
WHERE c.name = '未分配班级'
ORDER BY u.name;
