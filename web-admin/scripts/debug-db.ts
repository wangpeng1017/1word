
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('--- Debugging Students Table ---\n')

    try {
        // 1. Check Table Structure (using raw SQL because Prisma doesn't expose schema info easily)
        console.log('1. Table Structure for `students`:')
        const columns: any[] = await prisma.$queryRaw`DESCRIBE students`
        const wechatCol = columns.find((c: any) => c.Field === 'wechat_id')
        console.log('wechat_id column definition:')
        console.log(wechatCol || 'Column not found!')

        console.log('\n--------------------------------\n')

        // 2. Check Data Distribution
        console.log('2. checking wechat_id values:')

        const countNull = await prisma.students.count({
            where: { wechat_id: null }
        })
        console.log(`- NULL count: ${countNull}`)

        // Prisma might treat empty string as just a string, let's count them
        const countEmpty = await prisma.students.count({
            where: { wechat_id: '' }
        })
        console.log(`- Empty String ('') count: ${countEmpty}`)

        const total = await prisma.students.count()
        console.log(`- Total students: ${total}`)

        console.log('\n--------------------------------\n')

        // 3. Diagnosis
        if (wechatCol && wechatCol.Null === 'NO') {
            console.log('❌ CRITICAL ISSUE: `wechat_id` is NOT NULL in database, but optional in Prisma schema.')
            console.log('   This causes insertions to default to empty string, leading to unique constraint violations.')
        } else if (countEmpty > 0) {
            console.log('⚠️ WARNING: Found empty strings in `wechat_id`.')
            console.log('   If `wechat_id` is unique, you can only have ONE empty string. Subsequent inserts will fail.')
        } else {
            console.log('✅ Schema looks OK (Nullable). Constraint violation might be from concurrent inserts or race conditions?')
        }

    } catch (e) {
        console.error('Error running debug:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
