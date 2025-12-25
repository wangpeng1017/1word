/**
 * 检查并修复管理员账号的 role 值
 * 使用原生 pg 库连接阿里云数据库
 */
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    })

    try {
        console.log('🔍 检查所有用户的 role 值...\n')

        // 获取所有用户
        const result = await pool.query(`
      SELECT id, name, email, phone, role, is_active 
      FROM users 
      ORDER BY created_at DESC
    `)

        const users = result.rows
        console.log(`找到 ${users.length} 个用户:\n`)

        const invalidRoles: typeof users = []

        for (const user of users) {
            const roleStatus = ['ADMIN', 'TEACHER', 'STUDENT'].includes(user.role)
                ? '✅'
                : '❌ (需要修复)'

            if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(user.role)) {
                invalidRoles.push(user)
            }

            console.log(`${roleStatus} ${user.name} | ${user.email || user.phone || '无联系方式'} | role: "${user.role}"`)
        }

        if (invalidRoles.length > 0) {
            console.log(`\n⚠️ 发现 ${invalidRoles.length} 个账号的 role 值无效，开始自动修复...`)

            for (const user of invalidRoles) {
                // 根据原来的 role 值判断应该修复为什么
                let newRole = 'STUDENT'
                const lowerRole = user.role.toLowerCase()
                if (lowerRole === 'admin') {
                    newRole = 'ADMIN'
                } else if (lowerRole === 'teacher') {
                    newRole = 'TEACHER'
                }

                await pool.query(`UPDATE users SET role = $1 WHERE id = $2`, [newRole, user.id])
                console.log(`  ✅ 已修复: ${user.name} | ${user.role} -> ${newRole}`)
            }

            console.log('\n✅ 修复完成！')
        } else {
            console.log('\n✅ 所有账号的 role 值都有效')
        }

        // 特别检查非学生角色的账号
        console.log('\n📋 管理员和教师账号列表:')
        const admins = users.filter((u: any) =>
            u.role === 'ADMIN' || u.role === 'TEACHER' ||
            u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'teacher'
        )

        if (admins.length === 0) {
            console.log('⚠️ 没有找到管理员或教师账号！')
        } else {
            for (const admin of admins) {
                console.log(`  - ${admin.name} (${admin.email || admin.phone}) | role: "${admin.role}" | active: ${admin.is_active}`)
            }
        }

    } finally {
        await pool.end()
    }
}

main().catch(console.error)
