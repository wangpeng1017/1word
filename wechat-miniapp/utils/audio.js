/**
 * @file audio.js
 * @desc 音效播放工具模块，提供答题激励音效播放功能
 * @see PRD: docs/待开发功能清单.md
 */

// 音效类型枚举
const SoundType = {
    CORRECT: 'correct',      // 答对
    WRONG: 'wrong',          // 答错
    STREAK_5: 'streak_5',    // 连对5题
    STREAK_10: 'streak_10',  // 连对10题
    COMPLETE: 'complete'     // 完成学习
}

// 免费在线音效 URL（来源：公共域/CC0 音效）
// 您可以替换为自己上传到阿里云 OSS 的音效 URL
const SOUND_URLS = {
    // 答对音效 - 清脆叮声
    correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    // 答错音效 - 低沉错误声
    wrong: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3',
    // 连对5题 - 成就解锁
    streak_5: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    // 连对10题 - 升级音效
    streak_10: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    // 完成学习 - 胜利音效
    complete: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
}

// 音效上下文缓存
let audioContexts = {}

/**
 * 播放音效
 * @param {string} type - 音效类型，使用 SoundType 枚举值
 */
function playSound(type) {
    try {
        // 检查音效开关设置（默认开启）
        const soundEnabled = wx.getStorageSync('soundEnabled')
        if (soundEnabled === false) return  // 明确关闭才不播放

        const soundUrl = SOUND_URLS[type]
        if (!soundUrl) {
            console.warn('[Audio] 未知音效类型:', type)
            return
        }

        // 创建或复用 AudioContext
        if (!audioContexts[type]) {
            audioContexts[type] = wx.createInnerAudioContext()
            audioContexts[type].src = soundUrl
            audioContexts[type].volume = 0.7  // 设置音量
            // 错误处理
            audioContexts[type].onError((err) => {
                console.warn('[Audio] 音效播放失败:', type, err)
            })
        }

        // 从头播放
        audioContexts[type].seek(0)
        audioContexts[type].play()
    } catch (e) {
        console.warn('[Audio] 音效播放异常:', e)
    }
}

/**
 * 预加载所有音效（提升首次播放体验）
 */
function preloadSounds() {
    try {
        Object.keys(SOUND_URLS).forEach(type => {
            if (!audioContexts[type]) {
                audioContexts[type] = wx.createInnerAudioContext()
                audioContexts[type].src = SOUND_URLS[type]
                audioContexts[type].volume = 0.7
            }
        })
        console.log('[Audio] 音效预加载完成')
    } catch (e) {
        console.warn('[Audio] 音效预加载失败:', e)
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
    updateSoundUrl
}
