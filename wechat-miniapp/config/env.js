// 环境配置
// 切换环境：修改ENV变量即可
// development: 本地开发环境
// preview: Vercel预览环境
// production: 阿里云生产环境

const ENV = 'preview' // 手动切换环境

const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    debug: true,
    name: '开发环境'
  },
  preview: {
    apiUrl: 'https://11word.vercel.app/api',
    debug: true,
    name: 'Vercel预览环境'
  },
  production: {
    apiUrl: 'http://47.92.96.143:3000/api',
    debug: false,
    name: '阿里云生产环境'
  }
}

// 导出当前环境配置
module.exports = config[ENV]

// 导出环境切换函数（可选）
module.exports.getConfig = function(env) {
  return config[env] || config.production
}

// 导出所有配置（用于调试）
module.exports.allConfigs = config
