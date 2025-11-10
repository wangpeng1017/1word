/**
 * Report audio migration status: total word_audios, migrated (Blob URLs), remaining, and sample of remaining
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const total = await prisma.word_audios.count()
    const migrated = await prisma.word_audios.count({
      where: { audioUrl: { contains: 'vercel-storage.com' } },
    })
    const remaining = total - migrated
    const sampleRemaining = await prisma.word_audios.findMany({
      where: { NOT: { audioUrl: { contains: 'vercel-storage.com' } } },
      select: { id: true, audioUrl: true, accent: true },
      take: 10,
    })

    console.log(JSON.stringify({ total, migrated, remaining, sampleRemaining }, null, 2))
  } catch (e) {
    console.error('Error reporting migration status:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
