'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

// 通用 fetcher，自动添加 token
const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const error = new Error('请求失败')
    throw error
  }
  return res.json()
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,      // 不在窗口聚焦时重新验证
        revalidateIfStale: true,       // 使用过期数据时重新验证
        dedupingInterval: 5000,        // 5秒内相同请求去重
        errorRetryCount: 2,            // 错误重试次数
        keepPreviousData: true,        // 保留上一次数据，切换时不闪烁
      }}
    >
      {children}
    </SWRConfig>
  )
}

export { fetcher }
