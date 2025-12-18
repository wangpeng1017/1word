
require('dotenv').config();

// 鏁版嵁搴撳垵濮嬪寲鑴氭湰
// 鐢ㄤ簬鍦╒ercel閮ㄧ讲鍚庡垵濮嬪寲鏁版嵁搴?
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('寮€濮嬪垵濮嬪寲鏁版嵁搴?..')

  // 鍒涘缓榛樿绯荤粺閰嶇疆
  const configs = [
    {
      key: 'review_timeout_hours',
      value: '24',
      description: '澶嶄範瓒呮椂鏃堕暱锛堝皬鏃讹級',
    },
    {
      key: 'daily_new_words',
      value: '20',
      description: '姣忔棩鏂板鍗曡瘝鏁伴噺',
    },
    {
      key: 'daily_review_limit',
      value: '50',
      description: '姣忔棩澶嶄範鍗曡瘝鏁伴噺涓婇檺',
    },
    {
      key: 'mastery_threshold',
      value: '3',
      description: '鎺屾彙闃堝€硷紙杩炵画姝ｇ‘娆℃暟锛?,
    },
    {
      key: 'difficult_threshold',
      value: '3',
      description: '闅剧偣闃堝€硷紙绱閿欒娆℃暟锛?,
    },
  ]

  for (const config of configs) {
    await prisma.system_configs.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }

  console.log('鉁?绯荤粺閰嶇疆鍒涘缓鎴愬姛')

  // 鍒涘缓榛樿绠＄悊鍛樿处鍙凤紙鍙€夛級
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vocab.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456'

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: '绯荤粺绠＄悊鍛?,
        role: 'TEACHER',
        teacher: {
          create: {
            school: '绀轰緥瀛︽牎',
          },
        },
      },
    })

    console.log('鉁?绠＄悊鍛樿处鍙峰垱寤烘垚鍔?)
    console.log(`   閭: ${adminEmail}`)
    console.log(`   瀵嗙爜: ${adminPassword}`)
  } else {
    console.log('鈩癸笍  绠＄悊鍛樿处鍙峰凡瀛樺湪')
  }

  console.log('鉁?鏁版嵁搴撳垵濮嬪寲瀹屾垚锛?)
}

main()
  .catch((e) => {
    console.error('鉂?鍒濆鍖栧け璐?', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
