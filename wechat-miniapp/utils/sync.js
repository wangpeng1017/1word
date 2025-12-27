/**
 * @file sync.js
 * @desc 学习进度同步服务 - 关键节点批量同步（优化5000+并发）
 * 同步时机：开始学习、退出/隐藏、完成学习
 */

const { post } = require('./request')
const { getSyncQueue, clearSyncQueue, addToSyncQueue } = require('./storage')

const app = getApp()

// 当前学习会话ID
let currentSessionId = null

// 网络状态
let isOnline = true

// 同步中标记
let isSyncing = false

/**
 * 初始化网络监听
 */
function initNetworkListener() {
  wx.onNetworkStatusChange((res) => {
    const wasOffline = !isOnline
    isOnline = res.isConnected
    if (wasOffline && isOnline) {
      syncOfflineQueue()
    }
  })

  wx.getNetworkType({
    success: (res) => {
      isOnline = res.networkType !== 'none'
    }
  })
}

/**
 * 创建/恢复学习会话
 */
async function createSession(totalWords) {
  const studentId = app?.globalData?.userInfo?.studentId
  if (!studentId || !isOnline) return null

  try {
    const response = await post('/study-sessions', { studentId, totalWords })
    if (response?.sessionId) {
      currentSessionId = response.sessionId
      return response
    }
  } catch (error) {
    console.error('[会话] 创建失败:', error)
  }
  return null
}

/**
 * 批量同步进度（退出/隐藏时调用）
 */
async function syncProgress(answers) {
  if (!currentSessionId || !isOnline || !answers?.length) return false

  try {
    await post(`/study-sessions/${currentSessionId}/progress`, { answers })
    return true
  } catch (error) {
    console.error('[同步] 批量同步失败:', error)
    return false
  }
}

/**
 * 完成学习会话
 */
async function completeSession() {
  if (!currentSessionId) return false

  if (!isOnline) {
    addToSyncQueue({ type: 'complete', sessionId: currentSessionId })
    return false
  }

  try {
    await post(`/study-sessions/${currentSessionId}/complete`)
    currentSessionId = null
    return true
  } catch (error) {
    console.error('[会话] 完成失败:', error)
    addToSyncQueue({ type: 'complete', sessionId: currentSessionId })
    return false
  }
}

/**
 * 同步离线队列
 */
async function syncOfflineQueue() {
  if (isSyncing) return

  const queue = getSyncQueue()
  if (!queue?.length) return

  isSyncing = true
  let successCount = 0
  const failedItems = []

  for (const item of queue) {
    try {
      if (item.type === 'study_complete') {
        await post('/study-records', item.data)
        successCount++
      } else if (item.type === 'complete' && item.sessionId) {
        await post(`/study-sessions/${item.sessionId}/complete`)
        successCount++
      } else {
        failedItems.push(item)
      }
    } catch (error) {
      failedItems.push(item)
    }
  }

  clearSyncQueue()
  failedItems.forEach(item => addToSyncQueue(item))
  isSyncing = false

  if (successCount > 0) {
    wx.showToast({ title: `已同步 ${successCount} 条数据`, icon: 'success', duration: 1500 })
  }
}

function getCurrentSessionId() { return currentSessionId }
function setCurrentSessionId(id) { currentSessionId = id }
function checkOnline() { return isOnline }

module.exports = {
  initNetworkListener,
  createSession,
  syncProgress,
  completeSession,
  syncOfflineQueue,
  getCurrentSessionId,
  setCurrentSessionId,
  checkOnline,
}
