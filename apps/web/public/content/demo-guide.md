# SynMatAI 演示说明配置

本文件控制网页右下角的“演示说明”卡片。保存后刷新网页即可预览。

## 编辑规则

每条说明以 `## [唯一编号] 标题` 开始，并使用以下字段：

- `scope`：说明所在层级，可填写 `page`、`workbench`、`flow-global`、`flow-stage`、`flow-package` 或 `default`。
- `key`：当前层级的定位编号。页面使用页面名；工作台使用 `工作包编号-任务编号`；阶段流程使用阶段编号；任务流程使用工作包编号。
- `project`：可选。填写项目 ID、项目名称或 `*`。`*` 表示所有项目通用。
- `image`：可选。使用站内 `/content/` 图片路径。
- `alt`：图片的替代文字。

匹配顺序为：**指定项目 + 精确 key** → **通用项目 + 精确 key** → 当前层级默认说明。阶段和工作包说明仍可使用通配 key。

工作台说明必须使用完整的 `工作包编号-TODO编号`，例如 `T11-TODO-002`；`T11-*` 不会匹配工作台。项目流程只读取 `flow-stage` 或 `flow-package` 内容，不读取 TODO 级说明。正文支持三级标题、列表和 `**加粗**`。

---

## [page-projects] 从项目列表开始
scope: page
key: projects
project: *
image: /content/demo-guide-overview.svg
alt: 从项目列表进入研发流程的示意图

### 实际工作中的使用
- 在这里创建、查找和继续项目，每个项目保存自己的流程进度、对话与资产。
- “项目工作台”用于继续当前任务，“项目流程”用于查看项目的全局进展。

### 演示建议
新建一个项目，观察系统如何先确认项目基础信息，再逐步展开后续研发任务。

## [page-overview] 查看项目概览
scope: page
key: overview
project: *
image: /content/demo-guide-overview.svg
alt: 项目概览页面示意图

### 实际工作中的使用
- 汇总项目状态、当前阶段、关键任务和近期产出。
- 从概览进入当前进行中的工作，而不需要重新定位流程节点。

### 演示建议
先确认当前阶段和进行中的工作包，再进入工作台继续处理任务。

## [page-experiments] 管理实验记录
scope: page
key: experiments
project: *
image: /content/demo-guide-research.svg
alt: 实验列表页面示意图

### 实际工作中的使用
- 集中查看项目中的实验计划、执行状态和实验记录。
- 实验结果可作为任务交付物回到项目流程中继续使用。

### 演示建议
查看不同实验的状态与关联任务，理解实验数据如何回流研发流程。

## [page-assets] 管理项目资产
scope: page
key: assets
project: *
image: /content/demo-guide-schema.svg
alt: 项目资产页面示意图

### 实际工作中的使用
- 统一管理项目 Schema、调研报告、实验记录、计算结果和审批材料。
- 资产与产生它的任务保持关联，便于追溯来源和复用。

### 演示建议
打开一份 Markdown 文档，查看它与当前工作包、任务和对话的关系。

---

## [workbench-P1T1-TODO-001] 补全项目基础信息
scope: workbench
key: P1T1-TODO-001
project: *
image: /content/demo-guide-schema.svg
alt: 用户与 Agent 共同补全项目 Schema 的示意图

### 实际工作中的使用
- 新创建项目后需要补充基础的项目背景，AI才可以主动开展工作；
- 避免AI工作方向偏离的问题；
- 这里以文字告诉AI项目的基础信息即可。

### 演示建议
- 在对话框中发送一段项目说明，AI会主动提示是否进入下一个任务中；
- 左侧为对话区，右侧为工作预览区，拖动可以修改两边面积；
- 右侧顶部可以在工作预览和项目工作流程之间切换；

## [workbench-P1T2-TODO-001]  梳理技术路线与证据缺口
scope: workbench
key: P1T2-TODO-001
project: *
image: /content/demo-guide-schema.svg
alt: 用户与 Agent 共同补全项目 Schema 的示意图

### 实际工作中的使用
- 实际项目中可能有一些节点是需要补充文件的，上传文件即可；
### 演示建议
- 对话资产那里上传文件的操作；
- 上传文件的操作没问题，直接点完成任务即可，不必真上传文件；
- 右侧工作预览区可以查看文档、和当前任务的操作按钮；

## [workbench-P1T2-TODO-002]  技术调研报告
scope: workbench
key: P1T2-TODO-002
project: *
image: /content/demo-guide-schema.svg
alt: 用户与 Agent 共同补全项目 Schema 的示意图

### 实际工作中的使用
- 实际项目中可能有一些节点是需要补充文件的，上传文件即可；
### 演示建议
- 这是一个调研节点，Agent会先做一轮调研，右侧工作预览区有AI的工作状态；
- AI调研完成后会造成一个文件，打开文件是左对话，右文件的布局；
- 拖动可以改变对话和文件窗口大小比例；
- 打开文件可以查看、修改文件正文，也可以让AI继续修改文件；
- 原型中没有接入真实的AI，对话不会真的修改文件。
- 

## [workbench-P1T3-TODO-001]  立项材料准备
scope: workbench
key: P1T3-TODO-001
project: *
image: /content/demo-guide-schema.svg
alt: 用户与 Agent 共同补全项目 Schema 的示意图

### 实际工作中的使用
- AI会主动先准备材料；
- 用户进来审核材料即可；
- 正式项目中是否需要AI准备材料，准备哪些材料可以由用户指定，也可以根据不同的项目告诉AI需要准备什么材料。

### 演示建议
- 没有特别演示操作；

## [workbench-P1T4-TODO-001]  确认SOP
scope: workbench
key: P1T4-TODO-001
project: *
image: /content/demo-guide-schema.svg
alt: 用户与 Agent 共同补全项目 Schema 的示意图

### 实际工作中的使用
- 这个节点是SOP拆分为实际的工作流；
- 研发阶段的工作流目前是写死的，实际工作中会根据项目的SOP实际拆分；

### 演示建议
- 完成这个节点，就会生成研发阶段的工作流拆分；
- 先点完成节点，然后切换到工作流视图，再看工作流是否好用。

## [workbench-T11-TODO-002] 整理相容性验证输入
scope: workbench
key: T11-TODO-002
project: *
image: /content/demo-guide-schema.svg
alt: 整理任务输入资料与交付要求的示意图

### 实际工作中的使用
- 当前任务负责整理输入资料、验证边界和交付要求。
- Agent 协助发现缺失项，用户负责确认资料是否可以进入验证环节。

### 演示建议
- 研发没有特别需要演示的，可以切换到工作流中，体验工作流与工作台状态的切换；
- 可以看看工作流中：阶段——工作包——任务，这种分层级的安排是否好用；
- 工作流视图下可以新建工作包，新建任务，删除工作包，删除任务；
- 工作流的自动布局、连续的操作；
- 切换到任务视图下，拖动Agent创建节点任务，安排Agent干活的操作是否好用。

## [workbench-T20-TODO-001] 推进研发任务
scope: workbench
key: T20-TODO-001
project: *
image: /content/demo-guide-workflow.svg
alt: 研发任务和交付物关系示意图

### 实际工作中的使用
- Agent 围绕当前 TODO 协助整理资料、形成工作草稿和检查交付条件。
- 用户确认任务结果后，系统继续进入同一工作包的下一任务。

### 演示建议
在工作台和项目流程之间切换，确认当前任务位置保持一致。

## [workbench-default] 当前任务工作台
scope: workbench
key: *
project: *
image: /content/demo-guide-overview.svg
alt: 当前任务工作台示意图

### 实际工作中的使用
工作台始终关联一个具体 TODO，集中展示该任务的 Agent 对话、输入资料、产生资产和专业工具。

### 演示建议
- 对话左上角图标是对话列表切换的按钮，可以展开收起历史对话；
- 原型环境没有接入真实AI，请完成当前TODO，继续项目流程推进；

---

## [flow-global] 浏览项目全局流程
scope: flow-global
key: global
project: *
image: /content/demo-guide-workflow.svg
alt: 项目全局流程示意图

### 实际工作中的使用
- 全局视图展示阶段之间的关系和项目整体进度。
- 进入某个阶段后，画布会切换为阶段或工作包层级。

### 演示建议
 - 工作流分为：阶段——任务包——任务三个层级；
 - 双击可进入到下一层级，双击顶部导航可以返回上一级，右上角可切换不同的层级；
 - 项目阶段不可编辑，每阶段的工作包以及任务均可以编辑。可以修改工作流程的连续，工作名的设置了以及任务的描述；
 - 鼠标滑过工作流节点可以编辑工作流。 

## [flow-stage-PH1] 项目立项阶段
scope: flow-stage
key: PH1
project: *
image: /content/demo-guide-approval.svg
alt: 项目立项阶段示意图

### 实际工作中的使用
- 这个阶段是项目初期的任务，会根据实际要求拆分这个阶段的工作

### 演示建议
- 双击工作包可以进入到更细节的层级的任务；
- 双击上部导航，可以返回到更上层的节点。

## [flow-stage-S1] 实施条件验证
scope: flow-stage
key: S1
project: *
image: /content/demo-guide-research.svg
alt: 实施条件验证阶段示意图

### 实际工作中的使用
该阶段先核对原料、设备、人员、方法和风险条件，确认项目具备进入路线比较的实施基础。
实际产品中会根据项目SOP以及公司实际的情况的需求产生实施条件需要验证的点

### 演示建议
目前研发阶段细分的任务很多，主要需要看下实验阶段中通过工作流安排和管理任务，以及安排AI干活的操作是不是好用。

## [flow-stage-S2] 路线筛选
scope: flow-stage
key: S2
project: *
image: /content/demo-guide-workflow.svg
alt: 路线筛选阶段示意图

### 实际工作中的使用
该阶段比较候选路线，通过计算、样板制备和性能验证筛选值得进入后续优化的方案。

### 演示建议
没有特别的演示效果，可以进入某个工作包查看内部 TODO。


## [flow-stage-default] 当前项目阶段
scope: flow-stage
key: *
project: *
image: /content/demo-guide-workflow.svg
alt: 当前项目阶段流程示意图

### 实际工作中的使用
阶段视图用于观察当前阶段中的工作包、状态和上下游关系。


## [flow-package-default] 当前工作包流程
scope: flow-package
key: *
project: *
image: /content/demo-guide-workflow.svg
alt: 当前工作包内部流程示意图

### 实际工作中的使用
 - 当前视图聚焦一个工作包，文件节点和任务节点使用不同样式，并按依赖顺序连接；
 - 双击可进入到下一层级，双击顶部导航可以返回上一级，右上角可切换不同的层级；
 - 已完成的任务不可修改，未完成的任务可以修改；
 - 鼠标滑过工作流节点可以编辑任务；
 - 可以新建任务，删除任务；
 - 工作流的自动布局、连续的操作；
 - 切换到任务视图下，拖动Agent创建节点任务，安排Agent干活的操作是否好用。


---

## [default] 认识当前工作区
scope: default
key: *
project: *
image: /content/demo-guide-overview.svg
alt: SynMatAI 项目研发工作区示意图

### 实际工作中的使用
这个原型把项目流程、Agent 对话、任务资产和专业工作区放在同一个连续环境中，减少工具切换和信息丢失。

### 演示说明
当前内容与交互用于演示产品流程，数据保存在浏览器本地，未连接真实 AI、科学计算服务或后端数据库。
