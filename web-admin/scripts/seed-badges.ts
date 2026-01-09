/**
 * @file seed-badges.ts
 * @desc 勋章系统种子数据
 */

import { PrismaClient, BadgeRarity } from '@prisma/client'

const prisma = new PrismaClient()

// 勋章定义数据
const badgesData = [
    {
        id: 'badge_bronze_newbie',
        name: '铜牌新手',
        icon: '🥉',
        description: '完成第一次学习',
        rarity: BadgeRarity.COMMON,
        achievementId: null, // 将在成就创建后关联
    },
    {
        id: 'badge_silver_apprentice',
        name: '银牌学徒',
        icon: '🥈',
        description: '累计学习50个单词',
        rarity: BadgeRarity.COMMON,
        achievementId: null,
    },
    {
        id: 'badge_gold_scholar',
        name: '金牌学者',
        icon: '🥇',
        description: '累计学习200个单词',
        rarity: BadgeRarity.RARE,
        achievementId: null,
    },
    {
        id: 'badge_streak_star',
        name: '连续之星',
        icon: '🔥',
        description: '连续7天学习',
        rarity: BadgeRarity.RARE,
        achievementId: null,
    },
    {
        id: 'badge_lightning_master',
        name: '闪电学霸',
        icon: '⚡',
        description: '连续30天学习',
        rarity: BadgeRarity.EPIC,
        achievementId: null,
    },
    {
        id: 'badge_perfectionist',
        name: '完美主义者',
        icon: '💎',
        description: '单次学习正确率100%',
        rarity: BadgeRarity.RARE,
        achievementId: null,
    },
    {
        id: 'badge_ultimate_master',
        name: '终极大师',
        icon: '🏆',
        description: '掌握500个单词',
        rarity: BadgeRarity.LEGENDARY,
        achievementId: null,
    },
    {
        id: 'badge_wrong_killer',
        name: '错题克星',
        icon: '📚',
        description: '答对100道错题',
        rarity: BadgeRarity.RARE,
        achievementId: null,
    },
    {
        id: 'badge_precision_shooter',
        name: '精准射手',
        icon: '🎯',
        description: '平均正确率达90%',
        rarity: BadgeRarity.EPIC,
        achievementId: null,
    },
    {
        id: 'badge_points_tycoon',
        name: '积分富豪',
        icon: '🌟',
        description: '累计获得5000积分',
        rarity: BadgeRarity.LEGENDARY,
        achievementId: null,
    },
]

// 可兑换成就数据
const redeemableAchievementsData = [
    {
        id: 'redeem_lucky_gift',
        name: '幸运礼包',
        icon: '🎁',
        description: '兑换后获得随机奖励',
        pointsCost: 500,
        category: 'decoration',
    },
    {
        id: 'redeem_rainbow_badge',
        name: '彩虹勋章',
        icon: '🌈',
        description: '纯装饰性勋章',
        pointsCost: 1000,
        category: 'badge',
    },
    {
        id: 'redeem_king_crown',
        name: '王者之冠',
        icon: '👑',
        description: '显示在名字旁边',
        pointsCost: 2000,
        category: 'badge',
    },
    {
        id: 'redeem_unicorn',
        name: '独角兽',
        icon: '🦄',
        description: '稀有装饰勋章',
        pointsCost: 3000,
        category: 'badge',
    },
    {
        id: 'redeem_crystal_ball',
        name: '神秘水晶',
        icon: '🔮',
        description: '传说级装饰勋章',
        pointsCost: 5000,
        category: 'badge',
    },
]

async function main() {
    console.log('开始创建勋章种子数据...')

    // 创建勋章
    for (const badge of badgesData) {
        await prisma.badges.upsert({
            where: { id: badge.id },
            update: badge,
            create: badge,
        })
        console.log(`✓ 创建勋章: ${badge.name}`)
    }

    // 创建可兑换成就
    for (const achievement of redeemableAchievementsData) {
        await prisma.redeemable_achievements.upsert({
            where: { id: achievement.id },
            update: achievement,
            create: achievement,
        })
        console.log(`✓ 创建可兑换成就: ${achievement.name}`)
    }

    console.log('✅ 勋章种子数据创建完成!')
}

main()
    .catch((e) => {
        console.error('❌ 创建种子数据失败:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
