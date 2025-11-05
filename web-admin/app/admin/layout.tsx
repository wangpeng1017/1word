'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { Layout, Menu, theme, Button, Avatar, Dropdown } from 'antd'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const menuItems: MenuItem[] = [
  {
    key: '/admin',
    icon: <HomeOutlined />,
    label: '控制台',
  },
  {
    key: '/admin/vocabularies',
    icon: <BookOutlined />,
    label: '词汇管理',
  },
  {
    key: '/admin/questions',
    icon: <FileTextOutlined />,
    label: '题目管理',
  },
  {
    key: '/admin/students',
    icon: <UserOutlined />,
    label: '学生管理',
  },
  {
    key: '/admin/classes',
    icon: <TeamOutlined />,
    label: '班级管理',
  },
  {
    key: '/admin/study-plans',
    icon: <CalendarOutlined />,
    label: '学习计划',
  },
  {
    key: '/admin/statistics',
    icon: <BarChartOutlined />,
    label: '学习统计',
  },
  {
    key: '/admin/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState('管理员')
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // 获取用户信息
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        setUserName(user.name || '管理员')
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }, [router])

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  // 获取当前选中的菜单
  const selectedKeys = [pathname]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%)',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
          borderRight: 'none',
        }}
      >
        <div
          style={{
            height: 64,
            margin: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 16,
            color: '#1f2937',
            fontSize: collapsed ? 24 : 18,
            fontWeight: 600,
            transition: 'all 0.3s',
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 28 }}>📚</span>
          ) : (
            <>
              <span style={{ fontSize: 24, marginRight: 8 }}>📚</span>
              <span>智能词汇复习</span>
            </>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s', background: '#f5f7fa' }}>
        <Header
          style={{
            padding: '0 32px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            borderRadius: '0 0 16px 16px',
            marginBottom: 2,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#4F46E5' }}>
                {userName.charAt(0)}
              </Avatar>
              <span style={{ marginLeft: 12, fontWeight: 500 }}>{userName}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 24px',
            padding: 32,
            minHeight: 280,
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
