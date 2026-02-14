/**
 * @file storage.js
 * @desc 本地存储工具函数 - 管理学习进度、离线数据等
 * @see PRD: docs/wechat-miniapp/PRD.md
 * 修复：存储按学生ID隔离，防止不同用户进度混淆
 * 修复：精简存储数据 + try-catch 防护，彻底解决微信 1MB 单条 entry 限制
 */

/**
 * 获取当前学生ID（用于存储隔离）
 */
function getCurrentStudentId() {
  try {
    const app = getApp()
    return app?.globalData?.userInfo?.studentId || 'unknown'
  } catch (e) {
    return 'unknown'
  }
}

/**
 * 获取带学生ID的存储key
 */
function getSessionKey() {
  const studentId = getCurrentStudentId()
  return `currentSession_${studentId}`
}

/**
 * 安全写入 storage，捕获 entry size limit 等错误
 * @param {string} key
 * @param {any} value
 * @returns {boolean} 是否写入成功
 */
function safeSetStorage(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (e) {
    console.error('[存储] setStorageSync 失败, key:', key, 'error:', e?.errMsg || e)
    return false
  }
}

/**
 * 精简 tasks 数组，只保留恢复进度所需的最小字段
 * 去除 questions/options/meanings/audios 等大体积数据
 * 恢复进度时从 API 重新拉取完整数据
 */
function slimTasks(tasks) {
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

/**
 * 保存答题进度（绑定学生ID）
 * tasks 会被精简存储（只保留骨架），恢复时需从 API 重新拉取完整数据
 */
function saveStudyProgress(data) {
  const studentId = getCurrentStudentId()
  const session = {
    ...data,
    // 关键：精简 tasks，大幅缩减存储体积
    tasks: slimTasks(data.tasks),
    studentId,
    startTime: data.startTime || Date.now(),
    lastUpdateTime: Date.now(),
  }
  safeSetStorage(getSessionKey(), session)
}

/**
 * 获取答题进度（校验学生ID）
 */
function getStudyProgress() {
  const currentStudentId = getCurrentStudentId()
  const session = wx.getStorageSync(getSessionKey())

  if (!session) {
    // 兼容旧版本：检查无前缀的存储
    const oldSession = wx.getStorageSync('currentSession')
    if (oldSession) {
      if (!oldSession.studentId || oldSession.studentId === currentStudentId) {
        console.log('[存储] 迁移旧版进度到新格式')
        oldSession.studentId = currentStudentId
        safeSetStorage(getSessionKey(), oldSession)
        wx.removeStorageSync('currentSession')
        return oldSession
      } else {
        console.warn('[存储] 旧进度属于其他用户，清除')
        wx.removeStorageSync('currentSession')
        return null
      }
    }
    return null
  }

  // 校验学生ID是否匹配
  if (session.studentId && session.studentId !== currentStudentId) {
    console.warn('[存储] 进度所属学生不匹配，清除旧进度')
    clearStudyProgress()
    return null
  }

  return session
}

/**
 * 清除答题进度
 */
function clearStudyProgress() {
  wx.removeStorageSync(getSessionKey())
  wx.removeStorageSync('currentSession')
}

/**
 * 清除所有学生的进度（登出时调用）
 */
function clearAllStudyProgress() {
  try {
    const info = wx.getStorageInfoSync()
    const keys = info.keys || []
    keys.forEach(key => {
      if (key.startsWith('currentSession')) {
        wx.removeStorageSync(key)
      }
    })
  } catch (e) {
    console.error('清除所有进度失败:', e)
  }
}

/**
 * 保存离线数据到同步队列（绑定学生ID）
 */
function addToSyncQueue(data) {
  const studentId = getCurrentStudentId()
  let queue = wx.getStorageSync('syncQueue') || []
  queue.push({
    ...data,
    studentId,
    timestamp: Date.now(),
  })
  safeSetStorage('syncQueue', queue)
}

/**
 * 获取同步队列
 */
function getSyncQueue() {
  return wx.getStorageSync('syncQueue') || []
}

/**
 * 清空同步队列
 */
function clearSyncQueue() {
  wx.removeStorageSync('syncQueue')
}

/**
 * 保存今日单词数据（离线缓存，精简版）
 * 同样精简 tasks 避免超限，离线缓存需要从 API 重新拉取完整数据
 */
function saveTodayWords(words) {
  const studentId = getCurrentStudentId()
  const today = new Date().toDateString()
  safeSetStorage(`todayWords_${studentId}`, {
    date: today,
    studentId,
    words: slimTasks(words),
  })
}

/**
 * 获取今日单词数据
 */
function getTodayWords() {
  const studentId = getCurrentStudentId()
  const data = wx.getStorageSync(`todayWords_${studentId}`)
  if (!data) return null

  const today = new Date().toDateString()
  if (data.date !== today) {
    wx.removeStorageSync(`todayWords_${studentId}`)
    return null
  }

  return data.words
}

/**
 * 保存音频文件到本地
 */
function saveAudioFile(url, localPath) {
  const audioCache = wx.getStorageSync('audioCache') || {}
  audioCache[url] = localPath
  safeSetStorage('audioCache', audioCache)
}

/**
 * 获取本地音频文件路径
 */
function getLocalAudioPath(url) {
  const audioCache = wx.getStorageSync('audioCache') || {}
  return audioCache[url] || null
}

module.exports = {
  saveStudyProgress,
  getStudyProgress,
  clearStudyProgress,
  clearAllStudyProgress,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  saveTodayWords,
  getTodayWords,
  saveAudioFile,
  getLocalAudioPath,
}
