'use client'

import { Button } from 'antd'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          智能词汇复习助手
        </h1>
        <h2 className="text-2xl text-gray-600 mb-6">
          教师管理后台
        </h2>
        <p className="text-lg text-gray-700 mb-8">
          基于艾宾浩斯遗忘曲线的智能词汇学习系统
        </p>
        <div className="flex gap-4 justify-center">
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
