/**
 * @file sync.js
 * @desc 学习进度同步服务 - 关键节点批量同步（优化5000+并发）
 * @input 依赖: request.js, storage.js, getApp()
 * @output 导出: createSession, syncProgress, completeSession, checkOnline 等
 * @pos 小程序核心 - 学习会话管理和进度同步
 * ⚠️ 注意：getApp() 必须在函数内部调用，不能在模块顶层调用
 */

const { post } = require('./request')
const { getSyncQueue, clearSyncQueue, addToSyncQueue } = require('./storage')

// 不在模块顶层获取 app，而是在函数内部获取

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
async function createSession(totalWords, mode, day) {
  const app = getApp() // 在函数内部获取 app
  const studentId = app?.globalData?.userInfo?.studentId
  console.log('[DEBUG] createSession 调用 - studentId:', studentId, 'isOnline:', isOnline, 'totalWords:', totalWords, 'mode:', mode, 'day:', day)
  console.log('[DEBUG] app.globalData.userInfo:', app?.globalData?.userInfo)

  if (!studentId || !isOnline) {
    console.log('[DEBUG] createSession 跳过 - studentId:', studentId, 'isOnline:', isOnline)
    return null
  }

  try {
    console.log('[DEBUG] 开始请求 /study-sessions')
    const response = await post('/study-sessions', { studentId, totalWords, mode: mode || 'unknown', day: day || null })
    console.log('[DEBUG] createSession 响应:', response)

    if (response?.sessionId) {
      currentSessionId = response.sessionId
      console.log('[DEBUG] 会话创建成功 - sessionId:', currentSessionId)
      return response
    }
    console.log('[DEBUG] 响应中没有 sessionId')
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
