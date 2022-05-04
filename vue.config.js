// vue.config.js配置
module.exports = {
    lintOnSave: false, //关闭语法检查
    pages: {
        index: {
            //入口
            entry: 'src/main.js',
        },
    },
    //开启代理服务器
    devServer: {
        port:8080
    },

}


