# SynMatAI v4 visual refinement

Operate mode: scientific workflow editor. Preserve the v3 information architecture and interactions.

Brand #5F36FC; neutral canvas #F5F6F8; paper #FFFFFF; primary text #243044; secondary text #5E6B7D; borders #E3E7EE. Green and amber retain semantic status meanings.

Segoe UI / Microsoft YaHei; body 14px; supporting labels generally 12px, compact graph metadata 11px. Left-aligned phase navigation, four-column dependency graph with horizontal scrolling on constrained widths. Sticky task header and composer retained. Model metadata and simulation settings use separate fieldsets.

Source: apps/web/index.html, src/features/workflow/workbench.js and src/styles/main.css. Build from the project root with node scripts/build.mjs. Refer to docs/project-context.md for the current decisions.


当前入口为 apps/web/index.html；样式由 src/styles/main.css 按顺序加载，最后 workbench.css 为 v4 视觉层。
保留项目状态和研发子阶段左对齐、任务标题吸顶、Copilot 输入框固定、分子模型上下居中、资产和待办上滑展开。
