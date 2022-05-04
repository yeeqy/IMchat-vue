import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false
//引入VueRouter
import VueRouter from 'vue-router'
//引入路由器
import ElementUI from 'element-ui';
import router from './router'
import store from './store'
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI);

//应用插件
Vue.use(VueRouter)

export default new Vue({
  router: router,
  store: store,
  render: h => h(App),
}).$mount('#app')
