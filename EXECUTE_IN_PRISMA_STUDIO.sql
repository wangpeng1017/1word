-- ============================================
-- 在 Prisma Studio Console 中执行此 SQL
-- ============================================
-- 账号信息:
--   邮箱: admin@vocab.com
--   密码: admin123456
-- ============================================

DO $$
DECLARE
    user_id TEXT;
    teacher_id TEXT;
    class_id TEXT;
BEGIN
    -- 创建用户
    INSERT INTO users (id, email, password, name, role, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'admin@vocab.com',
        '$2a$10$ethKLi2/YH0kcONK8KS1Y.EmTPiFi4ee9n34wUOG9znlmuYnj2aiK',
        '管理员',
        'TEACHER',
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO user_id;
    
    -- 创建教师记录
    INSERT INTO teachers (id, user_id, school, subject, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        user_id,
        '默认学校',
        '英语',
        NOW(),
        NOW()
    )
    RETURNING id INTO teacher_id;
    
    -- 创建默认班级
    INSERT INTO classes (id, name, grade, teacher_id, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        '未分配班级',
        '待分配',
        teacher_id,
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO class_id;
    
    RAISE NOTICE '✅ 管理员账号创建成功！';
    RAISE NOTICE 'User ID: %', user_id;
    RAISE NOTICE 'Teacher ID: %', teacher_id;
    RAISE NOTICE 'Default Class ID: %', class_id;
END $$;

-- 验证创建结果
SELECT u.id, u.email, u.name, u.role, t.id as teacher_id
FROM users u
LEFT JOIN teachers t ON t.user_id = u.id
WHERE u.email = 'admin@vocab.com';
