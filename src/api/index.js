/**
 * 包含n个接口请求函数的模块
 * 函数的返回值: promise对象
 */
import {ajax, GET, POST} from './ajax'


const BASE_URL = 'http://localhost:8888'

// 1、用户注册
export const register = ({username, password}) =>
    ajax(`${BASE_URL}/user/register`, POST, {
        username,
        password
    });

// 2、用户登录
export const login = ({username, password}) =>
    ajax(`${BASE_URL}/user/login`, POST, {
        username,
        password
    });

// 3、根据用户id查找用户
export const selectUserById = ({userId}) =>
    ajax(`${BASE_URL}/user/selectUserById`, GET, {
        userId,
    });

// 4、查询聊天记录
export const selectMessageByUserIdAndPage = ({fromUserId, toUserId, pageNum, pageSize}) =>
    ajax(`${BASE_URL}/message/selectMessageByUserIdAndPage`, GET, {
        fromUserId,
        toUserId,
        pageNum,
        pageSize
    });
