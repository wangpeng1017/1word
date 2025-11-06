-- 创建管理员账号
-- 邮箱: admin@vocab.com
-- 密码: admin123456
-- 密码哈希使用 bcrypt，下面是 admin123456 的哈希值

DO $$
DECLARE
    user_id TEXT;
    teacher_id TEXT;
    class_id TEXT;
BEGIN
    -- 检查用户是否已存在
    SELECT id INTO user_id FROM users WHERE email = 'admin@vocab.com';
    
    IF user_id IS NULL THEN
        -- 创建用户
        INSERT INTO users (id, email, password, name, role, is_active, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'admin@vocab.com',
            '$2a$10$YourGeneratedHashHere',  -- 这里需要替换为真实的密码哈希
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
        RAISE NOTICE '   邮箱: admin@vocab.com';
        RAISE NOTICE '   密码: admin123456';
        RAISE NOTICE '   用户ID: %', user_id;
        RAISE NOTICE '   教师ID: %', teacher_id;
        RAISE NOTICE '   默认班级ID: %', class_id;
    ELSE
        RAISE NOTICE '⚠️  用户已存在: %', user_id;
    END IF;
END $$;
