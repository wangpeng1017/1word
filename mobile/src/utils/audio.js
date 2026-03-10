/**
 * @file audio.js
 * @desc 音效播放工具模块 - Uni-app 版
 */

/**
 * 等待 userInfo 加载完成
 */
export function waitForUserInfo(maxWaitMs = 3000) {
    return new Promise((resolve) => {
        const app = getApp()
        if (!app) {
            resolve(null)
            return
        }

        if (app.globalData.userInfo?.studentId) {
            resolve(app.globalData.userInfo)
            return
        }

        const interval = 100
        const maxAttempts = maxWaitMs / interval
        let attempts = 0

        const checkInterval = setInterval(() => {
            attempts++
            if (app.globalData.userInfo?.studentId) {
                clearInterval(checkInterval)
                resolve(app.globalData.userInfo)
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval)
                resolve(null)
            }
        }, interval)
    })
}

// 音效类型枚举
export const SoundType = {
    CORRECT: 'correct',
    WRONG: 'wrong',
    STREAK_3: 'streak_3',
    STREAK_5: 'streak_5',
    STREAK_10: 'streak_10',
    COMPLETE: 'complete'
}

const SOUND_URLS = {
    correct: '/uploads/sounds/correct.mp3',
    wrong: '/uploads/sounds/wrong.mp3',
    streak_3: '/uploads/sounds/streak_3.mp3',
    streak_5: '/uploads/sounds/streak_5.mp3',
    streak_10: '/uploads/sounds/streak_10.mp3',
    complete: '/uploads/sounds/complete.mp3'
}

// 音效上下文缓存
let audioContexts = {}

/**
 * 播放音效
 */
export function playSound(type) {
    try {
        const soundEnabled = uni.getStorageSync('soundEnabled')
        if (soundEnabled === false) return

        const soundUrl = SOUND_URLS[type]
        if (!soundUrl) return

        let finalUrl = soundUrl
        if (soundUrl.startsWith('/')) {
            const app = getApp()
            const baseUrl = (app.globalData.apiUrl || '').replace(/\/api$/, '')
            finalUrl = baseUrl + soundUrl
        }

        if (!audioContexts[type]) {
            audioContexts[type] = uni.createInnerAudioContext()
            audioContexts[type].src = finalUrl
            audioContexts[type].volume = 0.7
        }

        const ctx = audioContexts[type]
        ctx.stop()
        setTimeout(() => {
            ctx.seek(0)
            ctx.play()
        }, 50)

    } catch (e) {
        console.warn('[Audio] 音效播放异常:', e)
    }
}

/**
 * 设置音效开关
 */
export function setSoundEnabled(enabled) {
    uni.setStorageSync('soundEnabled', enabled)
}

/**
 * 获取音效开关状态
 */
export function isSoundEnabled() {
    const value = uni.getStorageSync('soundEnabled')
    return value !== false
}

/**
 * 销毁所有音效
 */
export function destroySounds() {
    Object.values(audioContexts).forEach(ctx => {
        if (ctx && ctx.destroy) {
            ctx.destroy()
        }
    })
    audioContexts = {}
}
