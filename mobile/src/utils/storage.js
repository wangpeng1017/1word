/**
 * @file storage.js
 * @desc 本地存储工具函数 - Uni-app 版
 */

function getCurrentStudentId() {
    try {
        const app = getApp()
        return app?.globalData?.userInfo?.studentId || 'unknown'
    } catch (e) {
        return 'unknown'
    }
}

function getSessionKey() {
    const studentId = getCurrentStudentId()
    return `currentSession_${studentId}`
}

function safeSetStorage(key, value) {
    try {
        uni.setStorageSync(key, value)
        return true
    } catch (e) {
        console.error('[存储] setStorageSync 失败, key:', key, 'error:', e)
        return false
    }
}

export function slimTasks(tasks) {
    if (!Array.isArray(tasks)) return []
    return tasks.map(t => {
        const v = t.vocabulary || {}
        return {
            id: t.id,
            vocabularyId: t.vocabularyId || v.id,
            isNew: t.isNew,
            selectedQuestionId: t.selectedQuestionId || null,
        }
    })
}

export function saveStudyProgress(data) {
    const studentId = getCurrentStudentId()
    const session = {
        ...data,
        tasks: slimTasks(data.tasks),
        studentId,
        startTime: data.startTime || Date.now(),
        lastUpdateTime: Date.now(),
    }
    safeSetStorage(getSessionKey(), session)
}

export function getStudyProgress() {
    const currentStudentId = getCurrentStudentId()
    const session = uni.getStorageSync(getSessionKey())

    if (!session) return null

    if (session.studentId && session.studentId !== currentStudentId) {
        clearStudyProgress()
        return null
    }

    return session
}

export function clearStudyProgress() {
    uni.removeStorageSync(getSessionKey())
}

export function clearAllStudyProgress() {
    try {
        const info = uni.getStorageInfoSync()
        const keys = info.keys || []
        keys.forEach(key => {
            if (key.startsWith('currentSession')) {
                uni.removeStorageSync(key)
            }
        })
    } catch (e) {
        console.error('清除所有进度失败:', e)
    }
}

export function addToSyncQueue(data) {
    const studentId = getCurrentStudentId()
    let queue = uni.getStorageSync('syncQueue') || []
    queue.push({
        ...data,
        studentId,
        timestamp: Date.now(),
    })
    safeSetStorage('syncQueue', queue)
}

export function getSyncQueue() {
    return uni.getStorageSync('syncQueue') || []
}

export function clearSyncQueue() {
    uni.removeStorageSync('syncQueue')
}

export function saveTodayWords(words) {
    const studentId = getCurrentStudentId()
    const today = new Date().toDateString()
    safeSetStorage(`todayWords_${studentId}`, {
        date: today,
        studentId,
        words: slimTasks(words),
    })
}

export function getTodayWords() {
    const studentId = getCurrentStudentId()
    const data = uni.getStorageSync(`todayWords_${studentId}`)
    if (!data) return null

    const today = new Date().toDateString()
    if (data.date !== today) {
        uni.removeStorageSync(`todayWords_${studentId}`)
        return null
    }

    return data.words
}

export function saveAudioFile(url, localPath) {
    const audioCache = uni.getStorageSync('audioCache') || {}
    audioCache[url] = localPath
    safeSetStorage('audioCache', audioCache)
}

export function getLocalAudioPath(url) {
    const audioCache = uni.getStorageSync('audioCache') || {}
    return audioCache[url] || null
}
