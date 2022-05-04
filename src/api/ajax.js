/**
 * ajax请求函数模块
 * 返回值: promise对象(异步返回的数据是: response.data)
 */
import axios from 'axios'
import Vue from "/src/main"


export const GEEK_LOGS = "geeklogs"
export const TOKEN = "token"
export const GET = 'GET';
export const POST = 'POST';
export const PUT = 'PUT';
export const DELETE = 'DELETE';


/**
 * 为所有请求添加token
 */
axios.interceptors.request.use(function (config) {
    //添加token
    let token = localStorage.getItem("token");
    if (token) {
        config.headers[TOKEN] = token;
    }
    //添加特殊请求头
    config.headers.authorization = GEEK_LOGS;
    return config;
}, function (error) {
    return Promise.reject(error);
})
/**
 * 为所有请求添加拦截器，处理token失效问题
 */
axios.interceptors.response.use(
    response => {
        return response
    },
    error => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                case 403:
                    // 返回 401、403 清除token信息并跳转到登录页面
                    Vue.$store.dispatch('resetCurrentUser');
                    this.$router.replace({
                        path: '/login'
                    }).then(r => r)
            }
        }
        return Promise.reject(error.response)   // 返回接口返回的错误信息
    })

export function ajax(url, type, data = {}, configs) {
    return new Promise(function (resolve, reject) {
        // 执行异步ajax请求
        let promise;
        type = type.toUpperCase();
        if (type === GET) {
            // 准备url query参数数据
            let dataStr = '' //数据拼接字符串
            Object.keys(data).forEach(key => {
                if (data[key]) {
                    dataStr += key + '=' + data[key] + '&'
                }
            })
            if (dataStr !== '') {
                dataStr = dataStr.substring(0, dataStr.lastIndexOf('&'))
                url = url + '?' + dataStr
            }
            // 发送get请求
            promise = axios.get(url, configs)
        } else if (type === POST) {
            // 发送post请求
            promise = axios.post(url, data, configs)
        } else if (type === PUT) {
            //发送put请求
            promise = axios.put(url, data, configs);
        } else if (type === DELETE) {
            //发送delete请求
            promise = axios.delete(url, {
                data
            });
        }
        promise.then(function (response) {
            // 成功了调用resolve()
            resolve(response.data)
        }).catch(function (error) {
            //失败了调用reject()
            reject(error)
        })
    })
}

