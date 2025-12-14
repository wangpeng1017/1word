/**
 * 管理员密码重置脚本
 *
 * 使用场景：管理员忘记密码时，通过此脚本重置密码
 *
 * 使用方法：
 * 1. 确保已设置 DATABASE_URL 环境变量
 * 2. 运行: node scripts/reset-admin-password.js <邮箱或手机号> <新密码>
 *
 * 示例：
 *   node scripts/reset-admin-password.js admin@example.com 123456
 *   node scripts/reset-admin-password.js 13800138000 newpassword
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('使用方法: node scripts/reset-admin-password.js <邮箱或手机号> <新密码>')
    console.log('')
    console.log('示例:')
    console.log('  node scripts/reset-admin-password.js admin@example.com 123456')
    console.log('  node scripts/reset-admin-password.js 13800138000 newpassword')
    console.log('')
    console.log('如果不知道管理员账号，可以先列出所有教师账号:')
    console.log('  node scripts/reset-admin-password.js --list')
    process.exit(1)
  }

  // 列出所有教师账号
  if (args[0] === '--list') {
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: { id: true, name: true, email: true, phone: true, is_active: true }
    })

    if (teachers.length === 0) {
      console.log('没有找到教师账号')
    } else {
      console.log('教师账号列表:')
      console.log('─'.repeat(60))
      teachers.forEach((t, i) => {
        console.log(`${i + 1}. ${t.name}`)
        console.log(`   邮箱: ${t.email || '未设置'}`)
        console.log(`   手机: ${t.phone || '未设置'}`)
        console.log(`   状态: ${t.is_active ? '正常' : '已禁用'}`)
        console.log('')
      })
    }
    return
  }

  const identifier = args[0]
  const newPassword = args[1]

  if (newPassword.length < 6) {
    console.log('❌ 密码长度不能少于6位')
    process.exit(1)
  }

  // 查找用户
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier }
      ]
    },
    select: { id: true, name: true, email: true, phone: true, role: true }
  })

  if (!user) {
    console.log(`❌ 未找到账号: ${identifier}`)
    console.log('')
    console.log('提示: 运行 node scripts/reset-admin-password.js --list 查看所有教师账号')
    process.exit(1)
  }

  if (user.role !== 'TEACHER') {
    console.log(`❌ 该账号不是教师/管理员账号 (角色: ${user.role})`)
    process.exit(1)
  }

  // 加密新密码
  const hashedPassword = await hashPassword(newPassword)

  // 更新密码
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      updated_at: new Date()
    }
  })

  console.log('✅ 密码重置成功!')
  console.log('')
  console.log('账号信息:')
  console.log(`  姓名: ${user.name}`)
  console.log(`  邮箱: ${user.email || '未设置'}`)
  console.log(`  手机: ${user.phone || '未设置'}`)
  console.log(`  新密码: ${newPassword}`)
  console.log('')
  console.log('请使用新密码登录系统')
}

main()
  .catch((e) => {
    console.error('❌ 重置失败:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
