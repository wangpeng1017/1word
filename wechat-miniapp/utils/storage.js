/**
 * @file storage.js
 * @desc 本地存储工具函数 - 管理学习进度、离线数据等
 * @see 修复：存储按学生ID隔离，防止不同用户进度混淆
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
 * 保存答题进度（绑定学生ID）
 */
function saveStudyProgress(data) {
  const studentId = getCurrentStudentId()
  const session = {
    ...data,
    studentId, // 记录所属学生
    startTime: data.startTime || Date.now(),
    lastUpdateTime: Date.now(),
  }
  wx.setStorageSync(getSessionKey(), session)
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
      // 如果旧进度的studentId匹配或没有studentId字段，迁移到新格式
      if (!oldSession.studentId || oldSession.studentId === currentStudentId) {
        console.log('[存储] 迁移旧版进度到新格式')
        oldSession.studentId = currentStudentId
        wx.setStorageSync(getSessionKey(), oldSession)
        wx.removeStorageSync('currentSession')
        return oldSession
      } else {
        // 旧进度属于其他用户，清除
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
  // 同时清除旧版本的存储（兼容）
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
    studentId, // 记录所属学生
    timestamp: Date.now(),
  })
  wx.setStorageSync('syncQueue', queue)
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
 * 保存今日复习数据（离线模式，绑定学生ID）
 */
function saveTodayWords(words) {
  const studentId = getCurrentStudentId()
  const today = new Date().toDateString()
  wx.setStorageSync(`todayWords_${studentId}`, {
    date: today,
    studentId,
    words: words,
  })
}

/**
 * 获取今日复习数据
 */
function getTodayWords() {
  const studentId = getCurrentStudentId()
  const data = wx.getStorageSync(`todayWords_${studentId}`)
  if (!data) return null

  const today = new Date().toDateString()
  if (data.date !== today) {
    // 不是今天的数据，清除
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
  wx.setStorageSync('audioCache', audioCache)
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
