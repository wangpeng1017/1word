'use client'

import { Tabs } from 'antd'
import { SettingOutlined, UserAddOutlined, FileTextOutlined } from '@ant-design/icons'
import BasicSettings from './components/BasicSettings'
import AccountsManagement from './components/AccountsManagement'
import OperationLogs from './components/OperationLogs'

export default function SettingsPage() {
  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <SettingOutlined />
          基本设置
        </span>
      ),
      children: <BasicSettings />,
    },
    {
      key: 'accounts',
      label: (
        <span>
          <UserAddOutlined />
          账号管理
        </span>
      ),
      children: <AccountsManagement />,
    },
    {
      key: 'logs',
      label: (
        <span>
          <FileTextOutlined />
          操作日志
        </span>
      ),
      children: <OperationLogs />,
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          系统设置
        </h1>
        <p style={{ color: '#6B7280' }}>配置系统参数、管理账号和查看操作日志</p>
      </div>

      <Tabs
        defaultActiveKey="basic"
        items={tabItems}
        size="large"
        style={{
          background: '#fff',
          padding: '16px 24px',
          borderRadius: 8,
        }}
      />
    </div>
  )
}
