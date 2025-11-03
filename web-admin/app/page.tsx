import { Button, Typography } from 'antd'
import Link from 'next/link'

const { Title, Paragraph } = Typography

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <Title level={1}>智能词汇复习助手</Title>
        <Title level={2} type="secondary">教师管理后台</Title>
        <Paragraph className="mt-4 text-lg">
          基于艾宾浩斯遗忘曲线的智能词汇学习系统
        </Paragraph>
        <div className="mt-8 space-x-4">
          <Link href="/login">
            <Button type="primary" size="large">
              登录
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="large">
              进入后台
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
