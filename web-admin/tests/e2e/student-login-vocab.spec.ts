import { test, expect } from '@playwright/test'

const BASE = 'https://11word.vercel.app'

// 该用例将：
// 1) 管理员登录，创建一名临时学生（若已存在则跳过）
// 2) 用学生账号通过网页界面登录
// 3) 在浏览器上下文内携带 token 请求 /api/vocabularies 验证可访问

test('Student login UI -> fetch vocabularies API', async ({ page, request }) => {
  // 1) 管理员登录（API）
  const adminRes = await request.post(`${BASE}/api/auth/login`, {
    data: { email: 'admin@vocab.com', password: 'admin123456' },
  })
  expect(adminRes.ok()).toBeTruthy()
  const adminJson = await adminRes.json()
  const adminToken: string | undefined = adminJson?.data?.token
  expect(adminToken, 'admin token').toBeTruthy()

  // 2) 创建临时学生（API）
  const ts = Date.now()
  const studentNo = `E2E${ts}`
  const phone = studentNo
  const email = `e2e${ts}@vocab.com`

  const createRes = await request.post(`${BASE}/api/students`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      name: 'E2E 学生',
      studentNo,
      password: '123456',
      phone,
      email,
      grade: '高一',
    },
  })
  // 可能重复执行导致 400（学号/邮箱已存在），视为可接受
  expect([200, 400]).toContain(createRes.status())

  // 3) 学生用 UI 登录
  await page.goto(`${BASE}/login`)
  await page.getByRole('textbox', { name: '邮箱或手机号' }).fill(phone)
  await page.getByRole('textbox', { name: '密码' }).fill('123456')
  await page.getByRole('button', { name: '登 录' }).click()
  await page.waitForURL('**/dashboard')

  // 确认 token 注入到 localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'))
  expect(token, 'student token').toBeTruthy()

  // 4) 在页面上下文内使用 token 拉取词汇列表
  const resp = await page.evaluate(async () => {
    const token = localStorage.getItem('token')!
    const r = await fetch('/api/vocabularies?limit=1', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await r.json()
    return { status: r.status, success: json?.success, total: json?.data?.pagination?.total ?? 0 }
  })

  expect(resp.status).toBe(200)
  expect(resp.success).toBeTruthy()
})
