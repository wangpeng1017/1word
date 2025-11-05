const API_URL = "https://11word.vercel.app/api"

async function loginStudent() {
  console.log('测试学生登录...\n')
  
  try {
    const response = await fetch(`${API_URL}/auth/login-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: '2025001',
        password: '123456'
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✓ 登录成功！')
      console.log('  学生姓名:', result.data.userInfo.name)
      console.log('  学号:', result.data.userInfo.studentId)
      console.log('  Token:', result.data.token)
      console.log('\n正在获取今日任务...\n')
      
      // 获取今日任务
      const studentId = result.data.userInfo.studentId
      const token = result.data.token
      
      const tasksResponse = await fetch(`${API_URL}/students/${studentId}/daily-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const tasksResult = await tasksResponse.json()
      
      if (tasksResult.success) {
        const tasks = tasksResult.data
        console.log(`✓ 找到 ${tasks.length} 个任务`)
        
        // 检查有题目的任务数量
        const tasksWithQuestions = tasks.filter(task => 
          task.vocabulary && 
          task.vocabulary.questions && 
          task.vocabulary.questions.length > 0
        )
        
        console.log(`✓ 其中 ${tasksWithQuestions.length} 个任务有题目`)
        
        if (tasksWithQuestions.length > 0) {
          console.log('\n前3个任务示例:')
          tasksWithQuestions.slice(0, 3).forEach((task, index) => {
            console.log(`\n  ${index + 1}. ${task.vocabulary.word} - ${task.vocabulary.primaryMeaning}`)
            console.log(`     题目数量: ${task.vocabulary.questions.length}`)
          })
        } else {
          console.log('\n✗ 警告：所有任务都没有题目！')
        }
      } else {
        console.log('✗ 获取任务失败:', tasksResult.error)
      }
    } else {
      console.log('✗ 登录失败:', result.error)
    }
  } catch (error) {
    console.error('✗ 错误:', error.message)
  }
}

loginStudent()
