# 本地开发

最低 Node.js 20，当前环境已验证 Node.js 24。当前命令不依赖 npm 或第三方包。

启动：node scripts/dev-server.mjs
自定义端口：node scripts/dev-server.mjs --port 5174
检查：node scripts/check.mjs
测试：node --test scripts/dev-server.test.mjs
构建：node scripts/build.mjs

开发服务只监听 127.0.0.1。修改文件后刷新浏览器；当前未配置热更新。
服务只暴露 apps/web 下的页面与 src，以及 public 中的静态文件。
构建会重新生成根目录下的 dist；不要将手写文件放入 dist。
dist 内 index.html 引用 /src 与 /assets，部署时以 dist 为站点根目录。

目录入口：
- apps/web/index.html：布局与页面标签。
- apps/web/src/features/workflow/workbench.js：工作流、节点与参数。
- apps/web/src/features/copilot/assets-and-todos.js：资产、待办与引用。
- apps/web/src/features/copilot/composer-actions.js：文件/上下文菜单和命令。
- apps/web/src/styles/workbench.css：v4 主视觉调整。
- apps/web/public/assets/brand/synmatai-logo.png：用户提供的 Logo。

这次迁移不安装框架、不接真实 AI/求解器、不改写业务行为。后续完成技术选型后再补依赖锁文件、自动化 CI 和生产部署配置。
