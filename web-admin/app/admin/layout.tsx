'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
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
  ExperimentOutlined,
  FileSearchOutlined,
  FileExclamationOutlined,
  FolderOutlined,
  TrophyOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { Layout, Menu, theme, Button, Avatar, Dropdown } from 'antd'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

// 菜单配置 - 使用 Link 组件实现预加载
const menuItems: MenuItem[] = [
  {
    key: '/admin',
    icon: <HomeOutlined />,
    label: <Link href="/admin" prefetch={true}>控制台</Link>,
  },
  {
    key: 'vocabulary-group',
    icon: <BookOutlined />,
    label: '词汇管理',
    children: [
      {
        key: '/admin/vocabularies',
        icon: <BookOutlined />,
        label: <Link href="/admin/vocabularies" prefetch={true}>词汇列表</Link>,
      },
      {
        key: '/admin/vocabulary-packs',
        icon: <FolderOutlined />,
        label: <Link href="/admin/vocabulary-packs" prefetch={true}>词汇库</Link>,
      },
    ],
  },
  {
    key: '/admin/questions',
    icon: <FileTextOutlined />,
    label: <Link href="/admin/questions" prefetch={true}>题目管理</Link>,
  },
  {
    key: '/admin/students',
    icon: <UserOutlined />,
    label: <Link href="/admin/students" prefetch={true}>学生管理</Link>,
  },
  {
    key: '/admin/classes',
    icon: <TeamOutlined />,
    label: <Link href="/admin/classes" prefetch={true}>班级管理</Link>,
  },
  {
    key: '/admin/study-plans',
    icon: <CalendarOutlined />,
    label: <Link href="/admin/study-plans" prefetch={true}>学习计划</Link>,
  },
  {
    key: '/admin/proficiency-tests',
    icon: <ExperimentOutlined />,
    label: <Link href="/admin/proficiency-tests" prefetch={true}>测试题库</Link>,
  },
  {
    key: '/admin/test-records',
    icon: <FileSearchOutlined />,
    label: <Link href="/admin/test-records" prefetch={true}>测试记录</Link>,
  },
  {
    key: '/admin/learning-data',
    icon: <DatabaseOutlined />,
    label: <Link href="/admin/learning-data" prefetch={true}>学习数据</Link>,
  },
  {
    key: '/admin/wrong-questions',
    icon: <FileExclamationOutlined />,
    label: <Link href="/admin/wrong-questions" prefetch={true}>错题明细</Link>,
  },
  {
    key: '/admin/word-mastery',
    icon: <BarChartOutlined />,
    label: <Link href="/admin/word-mastery" prefetch={true}>单词掌握</Link>,
  },
  {
    key: '/admin/student-levels',
    icon: <TrophyOutlined />,
    label: <Link href="/admin/student-levels" prefetch={true}>等级数据</Link>,
  },
  {
    key: '/admin/settings',
    icon: <SettingOutlined />,
    label: <Link href="/admin/settings" prefetch={true}>系统设置</Link>,
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

  // 获取需要展开的菜单组
  const getOpenKeys = () => {
    if (pathname.startsWith('/admin/vocabularies') || pathname.startsWith('/admin/vocabulary-packs')) {
      return ['vocabulary-group']
    }
    return []
  }
  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys())

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
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          items={menuItems}
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
