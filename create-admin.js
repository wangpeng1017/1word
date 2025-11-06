// 创建管理员账号脚本
// 运行: node create-admin.js

const BASE_URL = 'http://localhost:3000'

async function createAdmin() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@vocab.com',
        password: 'admin123456',
        name: '管理员',
        role: 'TEACHER',
      }),
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ 管理员账号创建成功！')
      console.log('邮箱:', 'admin@vocab.com')
      console.log('密码:', 'admin123456')
      console.log('\nToken:', data.data.token)
      console.log('\n现在可以登录了：http://localhost:3000/login')
    } else {
      console.error('❌ 创建失败:', data.message)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
    console.log('\n请确保开发服务器正在运行: npm run dev')
  }
}

createAdmin()
