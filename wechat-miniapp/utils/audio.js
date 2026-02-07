/**
 * @file audio.js
 * @desc 音效播放工具模块，提供答题激励音效播放功能
 * @see PRD: docs/待开发功能清单.md
 */

// 等待 userInfo 加载完成（解决真机异步时序问题）
// 用于页面 onLoad/onShow 时等待 app.globalData.userInfo 加载完成
function waitForUserInfo(maxWaitMs = 3000) {
    return new Promise((resolve) => {
        const app = getApp()  // 在函数内部获取 app 实例
        if (!app) {
            resolve(null)
            return
        }

        // 如果已有 userInfo，直接返回
        if (app.globalData.userInfo?.studentId) {
            resolve(app.globalData.userInfo)
            return
        }

        // 等待 userInfo 加载（最多等待 maxWaitMs 毫秒）
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
                resolve(null)  // 超时返回 null
            }
        }, interval)
    })
}

// 音效类型枚举
const SoundType = {
    CORRECT: 'correct',      // 答对
    WRONG: 'wrong',          // 答错
    STREAK_3: 'streak_3',    // 连对3题
    STREAK_5: 'streak_5',    // 连对5题
    STREAK_10: 'streak_10',  // 连对10题
    COMPLETE: 'complete'     // 完成学习
}

// 免费在线音效 URL（来源：公共域/CC0 音效）
// 您可以替换为自己上传到阿里云 OSS 的音效 URL
const SOUND_URLS = {
    // 来源：本地服务器 (web-admin/public/uploads/sounds)
    // 注意：实际使用时会拼接 app.globalData.apiUrl
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
 * @param {string} type - 音效类型，使用 SoundType 枚举值
 */
function playSound(type) {
    try {
        // 检查音效开关设置(默认开启)
        const soundEnabled = wx.getStorageSync('soundEnabled')
        if (soundEnabled === false) return  // 明确关闭才不播放

        const soundUrl = SOUND_URLS[type]
        if (!soundUrl) {
            console.warn('[Audio] 未知音效类型:', type)
            return
        }

        // 处理相对路径
        let finalUrl = soundUrl
        if (soundUrl.startsWith('/')) {
            const app = getApp()
            const baseUrl = (app.globalData.apiUrl || '').replace(/\/api$/, '')
            finalUrl = baseUrl + soundUrl
        }

        // 创建或复用 AudioContext
        if (!audioContexts[type]) {
            audioContexts[type] = wx.createInnerAudioContext()
            audioContexts[type].src = finalUrl
            audioContexts[type].volume = 0.7  // 设置音量
            // 错误处理
            audioContexts[type].onError((err) => {
                console.warn('[Audio] 音效播放失败:', type, err)
            })
        }

        const ctx = audioContexts[type]

        // 修复: 先停止再播放,避免重复播放错误
        ctx.stop()

        // 延迟一小段时间再播放,确保停止完成
        setTimeout(() => {
            ctx.seek(0)
            ctx.play()
        }, 50)

    } catch (e) {
        console.warn('[Audio] 音效播放异常:', e)
    }
}

/**
 * 预加载所有音效（提升首次播放体验）
 */
function preloadSounds() {
    try {
        const app = getApp()
        const baseUrl = (app.globalData.apiUrl || '').replace(/\/api$/, '')

        Object.keys(SOUND_URLS).forEach(type => {
            if (!audioContexts[type]) {
                const soundUrl = SOUND_URLS[type]
                // 拼接完整 URL
                const finalUrl = soundUrl.startsWith('/') ? baseUrl + soundUrl : soundUrl

                audioContexts[type] = wx.createInnerAudioContext()
                audioContexts[type].src = finalUrl
                audioContexts[type].volume = 0.7
                // 错误处理，避免预加载失败影响使用
                audioContexts[type].onError((err) => {
                    console.warn('[Audio] 音效预加载失败:', type, err)
                })
            }
        })
        console.log('[Audio] 音效预加载完成')
    } catch (e) {
        console.warn('[Audio] 音效预加载异常:', e)
    }
}

/**
 * 销毁所有音效上下文（释放资源）
 */
function destroySounds() {
    Object.values(audioContexts).forEach(ctx => {
        if (ctx && ctx.destroy) {
            ctx.destroy()
        }
    })
    audioContexts = {}
}

/**
 * 设置音效开关
 * @param {boolean} enabled - 是否启用音效
 */
function setSoundEnabled(enabled) {
    wx.setStorageSync('soundEnabled', enabled)
}

/**
 * 获取音效开关状态
 * @returns {boolean} 音效是否启用
 */
function isSoundEnabled() {
    const value = wx.getStorageSync('soundEnabled')
    return value !== false  // 默认开启
}

/**
 * 更新音效 URL（用于替换为自定义音效）
 * @param {string} type - 音效类型
 * @param {string} url - 新的音效 URL
 */
function updateSoundUrl(type, url) {
    if (SOUND_URLS[type] !== undefined) {
        SOUND_URLS[type] = url
        // 清除已缓存的 context
        if (audioContexts[type]) {
            audioContexts[type].destroy()
            delete audioContexts[type]
        }
    }
}

module.exports = {
    SoundType,
    playSound,
    preloadSounds,
    destroySounds,
    setSoundEnabled,
    isSoundEnabled,
    waitForUserInfo,  // 导出等待 userInfo 的公共函数
    updateSoundUrl
}
