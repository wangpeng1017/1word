/**
 * 测试数据库连接
 */
import { prisma } from '../lib/prisma'

async function main() {
    console.log('=== 测试数据库连接 ===')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))

    try {
        console.log('1. 测试连接...')
        const count = await prisma.user.count()
        console.log('   用户总数:', count)

        console.log('2. 查询第一个用户...')
        const user = await prisma.user.findFirst()
        console.log('   用户:', user ? { id: user.id, email: user.email, phone: user.phone } : 'none')

        console.log('3. 测试 system_configs...')
        const config = await prisma.system_configs.findUnique({
            where: { key: 'customerService' }
        })
        console.log('   客服配置:', config ? 'exists' : 'not found')

        console.log('=== 测试完成 ===')
    } catch (error: any) {
        console.error('=== 错误 ===')
        console.error('Message:', error.message)
        console.error('Code:', error.code)
        console.error('Meta:', JSON.stringify(error.meta))
        console.error('Stack:', error.stack)
    } finally {
        await prisma.$disconnect()
    }
}

main()
