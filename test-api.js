// API 测试脚本
const API_URL = 'https://11word.vercel.app/api'

async function testAPI() {
  console.log('🚀 开始测试 API...\n')

  // 1. 健康检查
  console.log('📊 测试 1: 健康检查')
  const healthRes = await fetch(`${API_URL}/health`)
  const health = await healthRes.json()
  console.log('✅ 健康检查:', health)
  console.log('')

  // 2. 登录
  console.log('🔐 测试 2: 用户登录')
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@vocab.com',
      password: 'admin123456'
    })
  })
  const loginData = await loginRes.json()
  
  if (!loginData.success) {
    console.error('❌ 登录失败:', loginData)
    return
  }
  
  const token = loginData.data.token
  console.log('✅ 登录成功，获得 Token:', token.substring(0, 20) + '...')
  console.log('👤 用户信息:', loginData.data.user)
  console.log('')

  // 3. 获取词汇列表
  console.log('📚 测试 3: 获取词汇列表')
  const vocabRes = await fetch(`${API_URL}/vocabularies`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const vocabData = await vocabRes.json()
  console.log(`✅ 词汇列表 (共 ${vocabData.data?.length || 0} 个):`, vocabData.data?.slice(0, 3))
  console.log('')

  // 4. 获取学生列表
  console.log('👨‍🎓 测试 4: 获取学生列表')
  const studentsRes = await fetch(`${API_URL}/students`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const studentsData = await studentsRes.json()
  console.log(`✅ 学生列表 (共 ${studentsData.data?.length || 0} 个):`, studentsData.data?.slice(0, 3))
  console.log('')

  // 5. 获取班级列表
  console.log('🏫 测试 5: 获取班级列表')
  const classesRes = await fetch(`${API_URL}/classes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const classesData = await classesRes.json()
  console.log(`✅ 班级列表 (共 ${classesData.data?.length || 0} 个):`, classesData.data?.slice(0, 3))
  console.log('')

  // 6. 测试每日任务 API (如果有学生数据)
  if (studentsData.data && studentsData.data.length > 0) {
    const studentId = studentsData.data[0].id
    console.log('📝 测试 6: 获取学生每日任务')
    const tasksRes = await fetch(`${API_URL}/students/${studentId}/daily-tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const tasksData = await tasksRes.json()
    console.log(`✅ 每日任务 (共 ${tasksData.data?.length || 0} 个):`, tasksData)
    console.log('')

    // 7. 测试生成每日任务
    console.log('🎯 测试 7: 生成每日任务')
    const generateRes = await fetch(`${API_URL}/students/${studentId}/daily-tasks`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const generateData = await generateRes.json()
    console.log('✅ 生成任务结果:', generateData)
    console.log('')

    // 8. 测试错题本 API
    console.log('❌ 测试 8: 获取错题本')
    const wrongRes = await fetch(`${API_URL}/students/${studentId}/wrong-questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const wrongData = await wrongRes.json()
    console.log(`✅ 错题本 (共 ${wrongData.data?.wrongQuestions?.length || 0} 个):`, wrongData.data)
    console.log('')
  }

  console.log('🎉 所有测试完成！')
}

// 运行测试
testAPI().catch(console.error)
