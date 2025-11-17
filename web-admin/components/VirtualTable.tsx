'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Table, Spin } from 'antd'
import type { TableProps } from 'antd'

interface VirtualTableProps<T> extends Omit<TableProps<T>, 'dataSource' | 'pagination'> {
  /**
   * 初始数据
   */
  initialData?: T[]
  /**
   * 每页加载数量
   */
  pageSize?: number
  /**
   * 数据加载函数
   */
  loadData: (cursor: string | null, limit: number) => Promise<{
    data: T[]
    nextCursor: string | null
    hasMore: boolean
  }>
  /**
   * 滚动触发加载的阈值 (px)
   */
  scrollThreshold?: number
  /**
   * 唯一key字段
   */
  rowKey?: string | ((record: T) => string)
}

/**
 * 虚拟滚动表格组件
 * 
 * 特点:
 * 1. 支持无限滚动加载
 * 2. 使用游标分页减少服务器压力
 * 3. 自动触发加载更多
 * 4. 防抖处理
 */
export default function VirtualTable<T extends Record<string, any>>({
  initialData = [],
  pageSize = 20,
  loadData,
  scrollThreshold = 200,
  rowKey = 'id',
  ...tableProps
}: VirtualTableProps<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  // 加载更多数据
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return

    isLoadingRef.current = true
    setLoading(true)

    try {
      const result = await loadData(nextCursor, pageSize)
      
      setData(prev => [...prev, ...result.data])
      setNextCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [nextCursor, hasMore, loadData, pageSize])

  // 滚动事件处理
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    const scrollBody = target.querySelector('.ant-table-body')
    
    if (!scrollBody) return

    const scrollTop = scrollBody.scrollTop
    const scrollHeight = scrollBody.scrollHeight
    const clientHeight = scrollBody.clientHeight

    // 距离底部小于阈值时加载更多
    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      loadMore()
    }
  }, [scrollThreshold, loadMore])

  // 监听滚动事件
  useEffect(() => {
    const tableBody = tableRef.current?.querySelector('.ant-table-body')
    if (!tableBody) return

    tableBody.addEventListener('scroll', handleScroll)
    return () => {
      tableBody.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // 初始加载
  useEffect(() => {
    if (initialData.length === 0) {
      loadMore()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={tableRef} style={{ position: 'relative' }}>
      <Table
        {...tableProps}
        dataSource={data}
        rowKey={rowKey}
        pagination={false}
        scroll={{ y: 600, ...tableProps.scroll }}
        footer={() => (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            {loading && <Spin size="small" />}
            {!loading && !hasMore && data.length > 0 && (
              <span style={{ color: '#999' }}>已加载全部数据</span>
            )}
            {!loading && data.length === 0 && (
              <span style={{ color: '#999' }}>暂无数据</span>
            )}
          </div>
        )}
      />
    </div>
  )
}
