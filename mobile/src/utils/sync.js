/**
 * @file sync.js
 * @desc 学习进度同步服务 - Uni-app 版
 */

import { post } from './request'
import { getSyncQueue, clearSyncQueue, addToSyncQueue } from './storage'

let currentSessionId = null
let isOnline = true
let isSyncing = false

/**
 * 初始化网络监听
 */
export function initNetworkListener() {
    // #ifdef APP-PLUS || H5 || MP-WECHAT
    uni.onNetworkStatusChange((res) => {
        const wasOffline = !isOnline
        isOnline = res.isConnected
        if (wasOffline && isOnline) {
            syncOfflineQueue()
        }
    })

    uni.getNetworkType({
        success: (res) => {
            isOnline = res.networkType !== 'none'
        }
    })
    // #endif
}

/**
 * 创建/恢复学习会话
 */
export async function createSession(totalWords, mode, day, allowRepeat) {
    const app = getApp()
    const studentId = app?.globalData?.userInfo?.studentId

    if (!studentId || !isOnline) {
        return null
    }

    try {
        const response = await post('/study-sessions', {
            studentId,
            totalWords,
            mode: mode || 'unknown',
            day: day || null,
            allowRepeat: allowRepeat || false
        })

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
 * 批量同步进度
 */
export async function syncProgress(answers) {
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
export async function completeSession() {
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
export async function syncOfflineQueue() {
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
        uni.showToast({ title: `已同步 ${successCount} 条数据`, icon: 'success' })
    }
}

export function getCurrentSessionId() { return currentSessionId }
export function setCurrentSessionId(id) { currentSessionId = id }
export function checkOnline() { return isOnline }
