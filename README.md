# SynMatAI 开发项目

材料研发与跨尺度数值模拟工作台。前端起点为已确认的品牌紫 v4 原型。

后续页面开发先阅读 [项目上下文](docs/project-context.md)，集中了解产品结构、视觉规范、交互决策和实现范围。

## 启动

在此项目根目录打开终端，执行：

```powershell
node scripts/dev-server.mjs
```

浏览器打开 http://127.0.0.1:5173 。按 Ctrl+C 停止。当前原型零第三方依赖，无需 npm install。
如果环境支持 npm，也可以使用 npm run dev。

```powershell
node scripts/check.mjs
node --test scripts/dev-server.test.mjs
node scripts/build.mjs
```

构建文件输出到 dist/，可交给静态服务器托管。index.html 是开发入口；不要继续编辑旧演示目录中的打包 HTML。

## 目录

```text
SynMatAI/
├─ apps/
│  ├─ web/                      前端应用
│  │  ├─ index.html              页面入口
│  │  ├─ public/assets/brand/    品牌原始图片
│  │  └─ src/
│  │     ├─ features/workflow/   节点、依赖、参数、演示调度
│  │     ├─ features/copilot/    对话、资产、待办、命令
│  │     └─ styles/              样式及品牌主题
│  └─ api/                      后端范围与接口规划，尚无后端实现
├─ packages/contracts/          共享业务类型草案
├─ docs/                        产品、架构、开发、设计说明
├─ scripts/                     开发服务、构建和检查
├─ package.json                 项目命令及工作区定义
└─ dist/                        构建生成，不提交
```

## 当前边界

这是正式开发的起始骨架，业务行为仍来自交互原型：AI 回复、求解和结果为演示；未实现登录、多人协作、服务端存储和真实任务队列。
前端页面状态使用浏览器 localStorage；上传文件仅保存在本次页面会话。新端口属于新的浏览器存储来源，不自动迁移旧演示状态。

为保持交互与视觉，脚本暂保留经典脚本的加载顺序及共享作用域。styles/main.css 保留 v4 样式加载顺序，旧的局部覆盖尚未完全归并。正式功能开发时按 docs/architecture.md 分步解耦。

技术框架与后端语言暂未锁定，避免在需求和部署环境尚未确定时增加迁移成本。

## 研究流程原型

点击左侧“研究流程”，或打开 `http://127.0.0.1:5173/#research-flow`。默认计划审核，六阶段、21项人工任务均未执行；模拟执行需主动切换，所有文件和交付状态仅前端演示。详情见 `docs/research-flow.md`。专项检查：`node --test scripts/research-flow.test.mjs`。

项目概览：访问 `http://127.0.0.1:5173/#overview` 或点击左侧“项目概览”；使用独立可重置演示快照，详见 [项目概览说明](docs/project-overview.md)。
