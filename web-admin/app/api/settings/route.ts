import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 鑾峰彇绯荤粺璁剧疆
 * GET /api/settings
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('鍙湁鏁欏笀鍙互鏌ョ湅绯荤粺璁剧疆')
    }

    // 鑾峰彇鎵€鏈夎缃?
    const settings = await prisma.system_configs.findMany()

    // 杞崲涓洪敭鍊煎鏍煎紡
    const settingsMap: Record<string, any> = {}
    settings.forEach(setting => {
      try {
        // 灏濊瘯瑙ｆ瀽JSON鍊?
        settingsMap[setting.key] = JSON.parse(setting.value)
      } catch {
        // 濡傛灉涓嶆槸JSON锛岀洿鎺ヤ娇鐢ㄥ瓧绗︿覆鍊?
        settingsMap[setting.key] = setting.value
      }
    })

    // 濡傛灉娌℃湁璁剧疆锛岃繑鍥為粯璁ゅ€?
    if (Object.keys(settingsMap).length === 0) {
      settingsMap.systemInfo = {
        systemName: '鏅鸿兘璇嶆眹澶嶄範鍔╂墜',
        version: 'v1.0.0',
        defaultPassword: '123456',
      }
    }

    return successResponse(settingsMap)
  } catch (error) {
    console.error('鑾峰彇绯荤粺璁剧疆閿欒:', error)
    return errorResponse('鑾峰彇绯荤粺璁剧疆澶辫触', 500)
  }
}

/**
 * 鏇存柊绯荤粺璁剧疆
 * PUT /api/settings
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('鍙湁鏁欏笀鍙互淇敼绯荤粺璁剧疆')
    }

    const body = await request.json()
    const { key, value, description } = body

    if (!key) {
      return errorResponse('缂哄皯璁剧疆閿悕')
    }

    // 灏嗗€艰浆鎹负JSON瀛楃涓插瓨鍌?
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    // 鏇存柊鎴栧垱寤鸿缃?
    await prisma.system_configs.upsert({
      where: { key },
      create: {
        key,
        value: valueStr,
        description,
      },
      update: {
        value: valueStr,
        description,
      },
    })

    return successResponse({ key, value }, '璁剧疆宸叉洿鏂?)
  } catch (error) {
    console.error('鏇存柊绯荤粺璁剧疆閿欒:', error)
    return errorResponse('鏇存柊绯荤粺璁剧疆澶辫触', 500)
  }
}

/**
 * 鎵归噺鏇存柊绯荤粺璁剧疆
 * POST /api/settings/batch
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('鍙湁鏁欏笀鍙互淇敼绯荤粺璁剧疆')
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return errorResponse('鏃犳晥鐨勮缃暟鎹?)
    }

    // 鎵归噺鏇存柊璁剧疆
    const updates = Object.entries(settings).map(([key, value]) => {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
      
      return prisma.system_configs.upsert({
        where: { key },
        create: {
          key,
          value: valueStr,
        },
        update: {
          value: valueStr,
        },
      })
    })

    await Promise.all(updates)

    return successResponse(settings, '鎵归噺鏇存柊鎴愬姛')
  } catch (error) {
    console.error('鎵归噺鏇存柊绯荤粺璁剧疆閿欒:', error)
    return errorResponse('鎵归噺鏇存柊绯荤粺璁剧疆澶辫触', 500)
  }
}
