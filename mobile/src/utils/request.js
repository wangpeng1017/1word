/**
 * 网络请求封装 - Uni-app 版
 */

/**
 * 发送HTTP请求
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
export function request(options) {
    return new Promise((resolve, reject) => {
        // Uni-app 中 getApp() 通常可以直接使用
        const app = getApp()
        const { url, method = 'GET', data = {}, needAuth = true } = options

        const header = {
            'Content-Type': 'application/json',
        }

        // 添加认证 token
        if (needAuth && app && app.globalData && app.globalData.token) {
            header['Authorization'] = `Bearer ${app.globalData.token}`
        }

        // 获取 API URL
        const apiUrl = (app && app.globalData && app.globalData.apiUrl) || 'http://47.92.96.143:3000'

        uni.request({
            url: `${apiUrl}${url}`,
            method,
            data,
            header,
            success: (res) => {
                if (res.statusCode === 200) {
                    if (res.data.success) {
                        resolve(res.data.data)
                    } else {
                        uni.showToast({
                            title: res.data.error || '请求失败',
                            icon: 'none',
                        })
                        reject(res.data.error)
                    }
                } else if (res.statusCode === 401) {
                    uni.showToast({
                        title: '请先登录',
                        icon: 'none',
                    })
                    if (app && app.logout) {
                        app.logout()
                    }
                    reject('未授权')
                } else {
                    const errorMsg = res.data?.error || res.data?.message || `请求失败(${res.statusCode})`
                    console.error('请求错误:', res.statusCode, res.data)
                    uni.showToast({
                        title: errorMsg,
                        icon: 'none',
                        duration: 2500
                    })
                    reject(errorMsg)
                }
            },
            fail: (err) => {
                uni.showToast({
                    title: '网络请求失败',
                    icon: 'none',
                })
                reject(err)
            },
        })
    })
}

export function get(url, data = {}, needAuth = true) {
    return request({ url, method: 'GET', data, needAuth })
}

export function post(url, data = {}, needAuth = true) {
    return request({ url, method: 'POST', data, needAuth })
}

export function put(url, data = {}, needAuth = true) {
    return request({ url, method: 'PUT', data, needAuth })
}

export function patch(url, data = {}, needAuth = true) {
    return request({ url, method: 'PATCH', data, needAuth })
}

export function del(url, data = {}, needAuth = true) {
    return request({ url, method: 'DELETE', data, needAuth })
}
