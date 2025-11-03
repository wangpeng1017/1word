/**
 * 本地存储工具函数
 */

/**
 * 保存答题进度
 */
function saveStudyProgress(data) {
  const session = {
    ...data,
    startTime: data.startTime || Date.now(),
    lastUpdateTime: Date.now(),
  }
  wx.setStorageSync('currentSession', session)
}

/**
 * 获取答题进度
 */
function getStudyProgress() {
  return wx.getStorageSync('currentSession') || null
}

/**
 * 清除答题进度
 */
function clearStudyProgress() {
  wx.removeStorageSync('currentSession')
}

/**
 * 保存离线数据到同步队列
 */
function addToSyncQueue(data) {
  let queue = wx.getStorageSync('syncQueue') || []
  queue.push({
    ...data,
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
 * 保存今日复习数据（离线模式）
 */
function saveTodayWords(words) {
  const today = new Date().toDateString()
  wx.setStorageSync('todayWords', {
    date: today,
    words: words,
  })
}

/**
 * 获取今日复习数据
 */
function getTodayWords() {
  const data = wx.getStorageSync('todayWords')
  if (!data) return null

  const today = new Date().toDateString()
  if (data.date !== today) {
    // 不是今天的数据，清除
    wx.removeStorageSync('todayWords')
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
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  saveTodayWords,
  getTodayWords,
  saveAudioFile,
  getLocalAudioPath,
}
