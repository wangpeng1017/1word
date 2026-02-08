
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting cleanup of broken audio records...')

    // 1. Count bad records
    const count = await prisma.word_audios.count({
        where: {
            audioUrl: {
                startsWith: '/audios/words/'
            }
        }
    })

    console.log(`Found ${count} records with legacy path '/audios/words/'`)

    if (count === 0) {
        console.log('No cleanup needed.')
        return
    }

    // 2. Delete them
    const result = await prisma.word_audios.deleteMany({
        where: {
            audioUrl: {
                startsWith: '/audios/words/'
            }
        }
    })

    console.log(`Successfully deleted ${result.count} records.`)
    console.log('Now please run "npx tsx scripts/download-word-audios.ts" to regenerate correct records.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
