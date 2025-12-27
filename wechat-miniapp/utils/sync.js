/**
 * @file sync.js
 * @desc 学习进度同步服务 - 支持实时同步和离线队列
 */

const { post, patch } = require('./request')
const { getSyncQueue, clearSyncQueue, addToSyncQueue } = require('./storage')

const app = getApp()

// 当前学习会话ID
let currentSessionId = null

// 网络状态
let isOnline = true

// 同步队列处理中标记
let isSyncing = false

/**
 * 初始化网络监听
 */
function initNetworkListener() {
  wx.onNetworkStatusChange((res) => {
    const wasOffline = !isOnline
    isOnline = res.isConnected

    console.log(`[网络] 状态变化: ${isOnline ? '在线' : '离线'}`)

    // 从离线恢复到在线，自动同步队列
    if (wasOffline && isOnline) {
      console.log('[网络] 恢复在线，开始同步离线数据')
      syncOfflineQueue()
    }
  })

  // 初始检查网络状态
  wx.getNetworkType({
    success: (res) => {
      isOnline = res.networkType !== 'none'
    }
  })
}

/**
 * 创建学习会话
 * @param {number} totalWords 总词数
 * @returns {Promise<string|null>} 会话ID
 */
async function createSession(totalWords) {
  const studentId = app?.globalData?.userInfo?.studentId
  if (!studentId) {
    console.error('[会话] 未找到学生ID')
    return null
  }

  if (!isOnline) {
    console.log('[会话] 离线模式，跳过创建会话')
    return null
  }

  try {
    const response = await post('/study-sessions', {
      studentId,
      totalWords,
    })

    if (response && response.sessionId) {
      currentSessionId = response.sessionId
      console.log(`[会话] 创建成功: ${currentSessionId}, 恢复: ${response.isResumed}`)

      // 如果是恢复的会话，返回已有进度
      if (response.isResumed) {
        return {
          sessionId: response.sessionId,
          isResumed: true,
          completedWords: response.completedWords || 0,
          correctCount: response.correctCount || 0,
          wrongCount: response.wrongCount || 0,
        }
      }

      return { sessionId: response.sessionId, isResumed: false }
    }
  } catch (error) {
    console.error('[会话] 创建失败:', error)
  }

  return null
}

/**
 * 同步单题答案
 * @param {Object} answer 答题记录
 * @returns {Promise<boolean>} 是否成功
 */
async function syncAnswer(answer) {
  if (!currentSessionId) {
    console.log('[同步] 无会话ID，添加到离线队列')
    addToSyncQueue({ type: 'answer', data: answer })
    return false
  }

  if (!isOnline) {
    console.log('[同步] 离线模式，添加到队列')
    addToSyncQueue({ type: 'answer', data: answer, sessionId: currentSessionId })
    return false
  }

  try {
    await patch(`/study-sessions/${currentSessionId}/progress`, { answer })
    console.log(`[同步] 答题已同步: ${answer.vocabularyId}`)
    return true
  } catch (error) {
    console.error('[同步] 答题同步失败:', error)
    // 失败时添加到离线队列
    addToSyncQueue({ type: 'answer', data: answer, sessionId: currentSessionId })
    return false
  }
}

/**
 * 完成学习会话
 * @returns {Promise<boolean>} 是否成功
 */
async function completeSession() {
  if (!currentSessionId) {
    console.log('[会话] 无会话ID，跳过完成')
    return false
  }

  if (!isOnline) {
    console.log('[会话] 离线模式，添加完成请求到队列')
    addToSyncQueue({ type: 'complete', sessionId: currentSessionId })
    return false
  }

  try {
    await post(`/study-sessions/${currentSessionId}/complete`)
    console.log(`[会话] 完成: ${currentSessionId}`)
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
  if (isSyncing) {
    console.log('[同步] 正在同步中，跳过')
    return
  }

  const queue = getSyncQueue()
  if (!queue || queue.length === 0) {
    console.log('[同步] 队列为空')
    return
  }

  isSyncing = true
  console.log(`[同步] 开始同步 ${queue.length} 条离线数据`)

  let successCount = 0
  const failedItems = []

  for (const item of queue) {
    try {
      if (item.type === 'answer' && item.sessionId) {
        await patch(`/study-sessions/${item.sessionId}/progress`, { answer: item.data })
        successCount++
      } else if (item.type === 'complete' && item.sessionId) {
        await post(`/study-sessions/${item.sessionId}/complete`)
        successCount++
      } else if (item.type === 'study_complete') {
        // 旧版完整提交
        await post('/study-records', item.data)
        successCount++
      } else {
        failedItems.push(item)
      }
    } catch (error) {
      console.error('[同步] 项目失败:', error)
      failedItems.push(item)
    }
  }

  // 清空队列，保留失败的
  clearSyncQueue()
  failedItems.forEach(item => addToSyncQueue(item))

  isSyncing = false
  console.log(`[同步] 完成: 成功 ${successCount}, 失败 ${failedItems.length}`)

  if (successCount > 0) {
    wx.showToast({
      title: `已同步 ${successCount} 条数据`,
      icon: 'success',
      duration: 1500
    })
  }
}

/**
 * 获取当前会话ID
 */
function getCurrentSessionId() {
  return currentSessionId
}

/**
 * 设置当前会话ID（用于恢复）
 */
function setCurrentSessionId(sessionId) {
  currentSessionId = sessionId
}

/**
 * 检查是否在线
 */
function checkOnline() {
  return isOnline
}

module.exports = {
  initNetworkListener,
  createSession,
  syncAnswer,
  completeSession,
  syncOfflineQueue,
  getCurrentSessionId,
  setCurrentSessionId,
  checkOnline,
}
