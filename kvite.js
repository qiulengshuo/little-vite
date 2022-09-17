const Koa = require('koa');
const app = new Koa();
const fs = require('fs');
const path = require('path');

// 编译工具
const compilerSFC = require('@vue/compiler-sfc');
const compilerDOM = require('@vue/compiler-dom');

app.use(async (ctx) => {
  const { url, query } = ctx.request;
  // 返回html
  if (url === "/") {
    ctx.type = 'text/html';
    ctx.body = fs.readFileSync('./index.html', 'utf-8');
  } else if (url.endsWith(".js")) {
    // 返回main.js
    const p = path.join(__dirname, url);
    ctx.type = 'application/javascript';
    // 在 vite 中是把依赖模块用 ESBuild 去预构建依赖，指向依赖模块
    ctx.body = rewriteImport(fs.readFileSync(p, 'utf-8'));
  } else if (url.startsWith('/@modules/')) {
    // 裸模块名称 vue
    const moduleName = url.replace('/@modules/', '');
    // 模拟从 ESBuild 打包文件拿取模块(从 node_modules 拿)
    const prefix = path.join(__dirname, "./node_modules", moduleName);
    const module = require(prefix + '/package.json').module;
    const filePath = path.join(prefix, module);
    const ret = fs.readFileSync(filePath, 'utf-8');
    ctx.type = "application/javascript";
    ctx.body = rewriteImport(ret);
  } else if (url.indexOf('.vue') > -1) {
    const p = path.join(__dirname, url.split("?")[0]);
    // @vue/compiler-sfc 编译.vue -> 组件对象
    const ret = compilerSFC.parse(fs.readFileSync(p, 'utf-8'));
    if (!query.type) {
      const scriptContent = ret.descriptor.script.content;
      const script = scriptContent.replace('export default', 'const __script =');
      ctx.type = 'application/javascript';
      ctx.body = `
        ${rewriteImport(script)}
        import { render as __render } from '${url}?type=template'
        __script.render = __render
        export default __script
      `;
    } else if (query.type === 'template') {
      const tpl = ret.descriptor.template.content;
      // 编译 template -> render
      const render = compilerDOM.compile(tpl, { mode: "module" }).code;
      ctx.type = "application/javascript";
      ctx.body = rewriteImport(render);
    }
  }
});

// 裸模块路径重写 
// from 'vue' -> from '/@module/vue'
function rewriteImport (content) {
  return content.replace(/ from ['"](.*)['"]/g, (s1, s2) => {
    if (s2.startsWith("./") || s2.startsWith("../") || s2.startsWith("/")) {
      return s1;
    } else {
      return ` from '/@modules/${s2}'`;
    }
  });
}

app.listen(3000, () => {
  console.log("监听3000端口");
});
