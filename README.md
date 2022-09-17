# ✅实现

1.  🎈 开启服务器。
2.  🍕 返回模板 index.html (基于 ESM)。
3.  🍔 对于其他文件，vite 是使用 ESBuild 进行预构建依赖，然后把绝对路径改写为相对路径，指向构建好的文件；
    这里使用 导入 node_modules 打包构建好的文件 进行模拟。
4.  🍟 对于.vue 结尾的文件，使用@vue/compiler-sfc 编译，返回组件对象。
5.  🌭 对于 template 标签中的模板，使用@vue/compiler-dom 编译，返回 render 函数。
