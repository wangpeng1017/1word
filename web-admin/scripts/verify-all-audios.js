
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const prisma = new PrismaClient()
const PUBLIC_DIR = path.join(process.cwd(), 'public')

// Helper to get file hash
function getFileHash(filePath) {
    try {
        const buffer = fs.readFileSync(filePath)
        const hash = crypto.createHash('md5')
        hash.update(buffer)
        return hash.digest('hex')
    } catch (e) {
        return null
    }
}

async function main() {
    console.log('Starting comprehensive audio verification (JS version)...')

    const audios = await prisma.word_audios.findMany({
        include: {
            vocabularies: {
                select: { word: true }
            }
        }
    })

    console.log(`Total audio records to check: ${audios.length}`)

    let missingFiles = 0
    let legacyPaths = 0
    let validFiles = 0

    // Map hash -> List of { word, accent, filename }
    const hashMap = new Map()

    for (const record of audios) {
        // 1. Check path format
        if (record.audioUrl.startsWith('/audios/words/')) {
            legacyPaths++
        }

        // 2. Check file existence
        // Remove leading slash for path.join
        const relativePath = record.audioUrl.startsWith('/') ? record.audioUrl.slice(1) : record.audioUrl
        const fullPath = path.join(PUBLIC_DIR, relativePath)

        if (!fs.existsSync(fullPath)) {
            missingFiles++
            // Only log first 5 missing to avoid spam
            if (missingFiles <= 5) {
                console.log(`[Missing] ${record.vocabularies.word} (${record.accent}): ${record.audioUrl}`)
            }
        } else {
            validFiles++
            // 3. Compute Hash
            const hash = getFileHash(fullPath)
            if (hash) {
                if (!hashMap.has(hash)) {
                    hashMap.set(hash, [])
                }
                hashMap.get(hash).push({
                    word: record.vocabularies.word,
                    accent: record.accent,
                    filename: path.basename(fullPath)
                })
            }
        }
    }

    console.log('\n--- Summary ---')
    console.log(`Legacy Paths (/audios/words/): ${legacyPaths}`)
    console.log(`Missing Files: ${missingFiles}`)
    console.log(`Valid Files: ${validFiles}`)

    console.log('\n--- Duplicate Content Check ---')
    let duplicatesFound = 0
    for (const [hash, items] of hashMap.entries()) {
        if (items.length > 1) {
            // Check if items belong to DIFFERENT words
            const words = new Set(items.map(i => i.word))
            if (words.size > 1) {
                duplicatesFound++
                if (duplicatesFound <= 10) {
                    console.log(`\n[Duplicate Audio Content] Hash: ${hash.slice(0, 8)}...`)
                    console.log(`  Shared by words: ${Array.from(words).join(', ')}`)
                    items.forEach(i => console.log(`    - ${i.word} (${i.accent}): ${i.filename}`))
                }
            }
        }
    }

    if (duplicatesFound > 10) {
        console.log(`\n... and ${duplicatesFound - 10} more duplicate groups.`)
    }

    if (duplicatesFound === 0) {
        console.log('Good news! No audio content duplicates found between different words.')
    } else {
        console.log(`\nFound ${duplicatesFound} groups of words sharing identical audio files!`)
        console.log('This explains why you might hear "word A" when playing "word B".')
    }

    console.log('\n--- Recommendation ---')
    if (legacyPaths > 0 || missingFiles > 0 || duplicatesFound > 0) {
        console.log('Issues found. Recommended actions:')
        if (legacyPaths > 0) console.log('1. Delete records with legacy paths (run cleanup-bad-audios.js)')
        if (duplicatesFound > 0) console.log('2. Delete duplicate/incorrect audio files.')
        console.log('3. Re-run download-word-audios.ts (or js if available) to regenerate correct files.')
    } else {
        console.log('All checks passed. System assumes files on disk match their filenames.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
