
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('--- Fixing Database Schema ---\n')

    try {
        // 1. ALTER TABLE to make wechat_id nullable
        console.log('1.Executing: ALTER TABLE students MODIFY wechat_id VARCHAR(191) NULL DEFAULT NULL;')

        // Using $executeRawUnsafe for DDL
        // Correctly passing a string, NOT a template literal
        await prisma.$executeRawUnsafe('ALTER TABLE students MODIFY wechat_id VARCHAR(191) NULL DEFAULT NULL;')

        console.log('✅ Schema updated successfully!')

        console.log('\n--------------------------------\n')

        // 2. Verify the change
        console.log('2. Verifying Table Structure:')
        const columns: any[] = await prisma.$queryRaw`DESCRIBE students`
        const wechatCol = columns.find((c: any) => c.Field === 'wechat_id')
        console.log('New wechat_id definition:')
        console.log(wechatCol)

        if (wechatCol && wechatCol.Null === 'YES') {
            console.log('\n✨ SUCCESS: `wechat_id` is now NULLABLE. You can now create students without errors.')
        } else {
            console.log('\n❌ ERROR: Failed to update schema. `wechat_id` is still NOT NULL.')
        }

    } catch (e) {
        console.error('Error fixing schema:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
