// 网络请求封装
const app = getApp()

/**
 * 发送HTTP请求
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = {}, needAuth = true } = options

    const header = {
      'Content-Type': 'application/json',
    }

    // 添加认证token
    if (needAuth && app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`
    }

    wx.request({
      url: `${app.globalData.apiUrl}${url}`,
      method,
      data,
      header,
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.success) {
            resolve(res.data.data)
          } else {
            wx.showToast({
              title: res.data.error || '请求失败',
              icon: 'none',
            })
            reject(res.data.error)
          }
        } else if (res.statusCode === 401) {
          // 未授权，跳转登录
          wx.showToast({
            title: '请先登录',
            icon: 'none',
          })
          app.logout()
          reject('未授权')
        } else {
          // 显示服务器返回的具体错误信息
          const errorMsg = res.data?.error || res.data?.message || `请求失败(${res.statusCode})`
          console.error('请求错误:', res.statusCode, res.data)
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2500
          })
          reject(errorMsg)
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
        })
        reject(err)
      },
    })
  })
}

/**
 * GET请求
 */
function get(url, data = {}, needAuth = true) {
  return request({ url, method: 'GET', data, needAuth })
}

/**
 * POST请求
 */
function post(url, data = {}, needAuth = true) {
  return request({ url, method: 'POST', data, needAuth })
}

/**
 * PUT请求
 */
function put(url, data = {}, needAuth = true) {
  return request({ url, method: 'PUT', data, needAuth })
}

/**
 * DELETE请求
 */
function del(url, data = {}, needAuth = true) {
  return request({ url, method: 'DELETE', data, needAuth })
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
}
