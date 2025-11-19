
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Starting cleanup...')

        // Delete all study plans
        const deletedPlans = await prisma.study_plans.deleteMany({})
        console.log(`Deleted ${deletedPlans.count} study plans.`)

        // Delete all plan classes (batch generation records)
        const deletedPlanClasses = await prisma.plan_classes.deleteMany({})
        console.log(`Deleted ${deletedPlanClasses.count} plan class records.`)

        console.log('Cleanup completed successfully.')
    } catch (error) {
        console.error('Error during cleanup:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
