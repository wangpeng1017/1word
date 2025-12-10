const { PrismaClient } = require('./web-admin/node_modules/@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL || process.env.DATABASE_URL
    }
  }
});

async function exportData() {
  console.log('Exporting data from Vercel Postgres...');

  const data = {
    users: await prisma.user.findMany(),
    vocabularies: await prisma.vocabulary.findMany(),
    meanings: await prisma.meaning.findMany(),
    questions: await prisma.question.findMany(),
    wordAudios: await prisma.wordAudio.findMany(),
    studySessions: await prisma.studySession.findMany(),
    studyRecords: await prisma.studyRecord.findMany(),
    wrongRecords: await prisma.wrongRecord.findMany(),
  };

  console.log('Counts:', {
    users: data.users.length,
    vocabularies: data.vocabularies.length,
    meanings: data.meanings.length,
    questions: data.questions.length,
    wordAudios: data.wordAudios.length,
    studySessions: data.studySessions.length,
    studyRecords: data.studyRecords.length,
    wrongRecords: data.wrongRecords.length,
  });

  fs.writeFileSync('backup-data.json', JSON.stringify(data, null, 2));
  console.log('Data exported to backup-data.json');
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
