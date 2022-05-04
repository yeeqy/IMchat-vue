// 该文件专门用于创建整个应用的路由器
import VueRouter from 'vue-router'
import Login from "@/pages/Login";
import Chat from "@/pages/Chat";
import {WOLF_CHAT_CURRENT_USER} from "@/common";
import ElementUI from 'element-ui';

/**
 * 路由白名单，不需要登录
 * @type {string[]}
 */
const WHITELIST = ["/login"]

//创建并暴露一个路由器
const router = new VueRouter({
    mode: "history",
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            component: Login
        },
        {
            path: '/chat',
            component: Chat
        },
        {
            path: '*',
            redirect:'/login'
        },
    ],
})

//全局前置路由守卫————初始化的时候被调用、每次路由切换之前被调用
//判断用户是否登录，否则某些资源不能访问
router.beforeEach((to, from, next) => {
    //判断放行条件
    if (permit(to, from, next)) {
        next();
    } else {
        //跳转至主页
        router.replace("/").then(r => r).catch(r => r);
    }
})

//返回true放行，反之拦截
function permit(to, from, next) {
    //获取sessionStorage中的state
    let currentUser = JSON.parse(localStorage.getItem(WOLF_CHAT_CURRENT_USER));
    //如果用户未登录
    if (!currentUser) {
        //如果访问的是白名单中的地址，则放行,反之拦截
        if (WHITELIST.includes(to.path)) {
            return true;
        } else {
            ElementUI.Message.warning("您未登录，请登录！");
            return false;
        }
    }
    return true;
}


export default router;
