'use client'

import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4F46E5',
          borderRadius: 8,
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
