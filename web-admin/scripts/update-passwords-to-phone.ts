/**
 * @file 批量更新学生密码为手机号
 * @desc 将所有学生用户的密码从 123456 更新为各自的手机号
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('========== 批量更新学生密码为手机号 ==========')

    // 获取所有学生用户（含手机号）
    const students = await prisma.students.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    role: true,
                }
            }
        }
    })

    console.log(`共找到 ${students.length} 个学生`)

    let updated = 0
    let skipped = 0
    let failed = 0

    // 缓存密码哈希，相同手机号只哈希一次
    const hashCache = new Map<string, string>()

    for (const student of students) {
        const phone = student.user?.phone
        if (!phone) {
            console.log(`  跳过: ${student.user?.name || student.id} (无手机号)`)
            skipped++
            continue
        }

        try {
            let hashedPassword = hashCache.get(phone)
            if (!hashedPassword) {
                hashedPassword = await bcrypt.hash(phone, 10)
                hashCache.set(phone, hashedPassword)
            }

            await prisma.user.update({
                where: { id: student.user!.id },
                data: { password: hashedPassword }
            })

            updated++
        } catch (err) {
            console.error(`  失败: ${student.user?.name} (${phone}): ${err}`)
            failed++
        }
    }

    console.log('\n========== 更新完成 ==========')
    console.log(`成功: ${updated}`)
    console.log(`跳过: ${skipped}`)
    console.log(`失败: ${failed}`)

    await prisma.$disconnect()
}

main().catch(console.error)
