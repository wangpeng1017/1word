'use client'

import { ConfigProvider, App } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { SWRProvider } from '../lib/swr-config'

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
      <App>
        <SWRProvider>{children}</SWRProvider>
      </App>
    </ConfigProvider>
  )
}
