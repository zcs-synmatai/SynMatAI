# SynMatAI 演示说明配置

本文件配置原型中的“演示说明”。当前案例为高导热凝胶研发，内容来自 `run-02/thermal_gal`；所有数值、状态与记录均为交互演示，不代表真实试验或放行结论。

## [page-projects] 从项目列表开始
scope: page
key: projects
project: *

### 实际工作中的使用
- 创建、查找和继续材料研发项目。
- 点击项目进入工作台，使用“项目概览”查看汇总信息。

### 演示建议
进入“高导热凝胶开发示例”可直接体验 T31 的实验 ELN；立项阶段已有完成记录。需要从头体验时新建项目，从需求确认逐步推进到 SOP 研发规划。

## [page-overview] 查看项目概览
scope: page
key: overview
project: *
image: /content/demo-guide-overview.svg
alt: 项目概览与关键指标汇总示意图

### 实际工作中的使用
- 汇总当前阶段、工作包、待办、近期文件和关键指标。
- 管理层可以快速了解从需求对齐到中试、质量监督的推进状态。

### 演示建议
切换“总览”“项目资产”“项目管理”。总览查看进展与指标，资产按研发阶段和节点查找文件，管理中设置成员角色及审批规则；“进入项目流程”按钮为页面跳转。

## [page-experiments] 管理导热凝胶实验
scope: page
key: experiments
project: *

### 实际工作中的使用
- 查看粉体处理、混炼、固化、BLT、D5470热学和可靠性实验。
- 实验记录与任务、样件、批次和资产保持追溯关系。

### 演示建议
打开一项实验，体验ELN记录、方案确认和结果回流。

## [page-assets] 查看项目资产
scope: page
key: assets
project: *

### 实际工作中的使用
- 按阶段、工作包和任务查看导热凝胶项目的文件资产。
- 统一追溯原料资格、批次任务、混炼记录、热学报告和资格交付包。

### 演示建议
展开研发阶段树，打开一份Markdown资产查看来源和关联任务。

## [workbench-default] 当前任务工作台
scope: workbench
key: *
project: *

### 实际工作中的使用
- 任务对话关联具体 TODO；SuperAgent项目总工、阶段和工作包对话使用 Supervisor 并展示工作流。
- 右侧预览区可以打开文档、ELN或计算模拟工作区。

### 演示建议
点击“完成任务”继续推进。若配置了对应审批规则，则先提交审批，通过后再更新任务与下游；节点资产页签始终保留。

## [workbench-T11-TODO-001] 粉体前处理与级配
scope: workbench
key: T11-TODO-001
project: *
image: /content/demo-guide-research.svg
alt: Agent 协助整理粉体前处理与级配证据的示意图

### 实际工作中的使用
- 核对AlN等关键填料的批次、PSD、KF和表面处理记录。
- Agent协助整理缺失证据，实验人员确认实际执行记录。

### 演示建议
查看本对话产生的资产，再回到流程确认它与“材料与级配”阶段的关系。

## [workbench-T21-TODO-001] 分段混炼与出罐
scope: workbench
key: T21-TODO-001
project: *

### 实际工作中的使用
- 记录分段投料、扭矩、温度、真空和出罐状态。
- 混炼记录作为固化、BLT和热学验证的上游输入。

### 演示建议
在对话和资产页签间切换，体验任务记录的连续协作。

## [workbench-T31-TODO-001] BLT与稳定性
scope: workbench
key: T31-TODO-001
project: *

### 实际工作中的使用
- 确认BLT重复性、Shore00、外观和3/7天稳定性。
- 实验类型任务会在预览区打开ELN。

### 演示建议
打开ELN页签，查看实验记录和节点资产并列存在。

## [workbench-T40-TODO-001] 多厚度热学验证
scope: workbench
key: T40-TODO-001
project: *

### 实际工作中的使用
- 通过D5470多厚度数据分析κ_bulk、κ_app和2Rc。
- 计算模拟类型任务在预览区提供专用工作区。

### 演示建议
调整对话与工作预览区宽度，查看计算工作区与资产页签。

## [flow-global] 浏览导热凝胶全局流程
scope: flow-global
key: global
project: *
image: /content/demo-guide-workflow.svg
alt: 导热凝胶研发工作流的阶段与任务关系示意图

### 实际工作中的使用
- 全局从项目立项开始，包含研发与量产；新项目的研发在 SOP 规划确认前保持待规划。
- 研发阶段1包含需求对齐、材料级配、小试混炼、固化薄层、热学可靠性、中试资格和质量监督；本轮最后由客户准入确认后续安排。
- 文件节点只传递资料，不阻断任务状态传播。

### 演示建议
单击选择、双击下钻，双击顶部节点回到上一层。左上后退/前进可恢复浏览位置，不撤销流程修改；切换任务对话进入工作台，选择 Supervisor 对话回到流程。

## [flow-stage-S0] 需求与资源对齐
scope: flow-stage
key: S0
project: *

### 实际工作中的使用
冻结产品等级、κ_bulk、κ_app、BLT、2Rc等指标定义，以及资源、供方和职责边界。

## [flow-stage-S1] 材料与级配
scope: flow-stage
key: S1
project: *

### 实际工作中的使用
形成关键原料接收、供方资格、粉体前处理和四峰级配的可追溯证据。

## [flow-stage-S2] 小试与混炼
scope: flow-stage
key: S2
project: *

### 实际工作中的使用
把既定候选落实为小批次，记录混炼、流变和快速热学筛选结果。

## [flow-stage-S3] 固化与薄层
scope: flow-stage
key: S3
project: *

### 实际工作中的使用
确认固化窗口、薄层样件、BLT重复性、硬度和稳定性。

## [flow-stage-S4] 热学与可靠性
scope: flow-stage
key: S4
project: *

### 实际工作中的使用
并行开展多厚度热学、可靠性和微观界面验证，分离体相与界面贡献。

## [flow-stage-S5] 中试与资格
scope: flow-stage
key: S5
project: *

### 实际工作中的使用
验证10—50kg中试一致性并准备最终资格和交付文件。

## [flow-stage-S6] 质量与监督
scope: flow-stage
key: S6
project: *

### 实际工作中的使用
建立SPC、单批放行、供方监督和NCR/CAPA再资格闭环。

## [flow-stage-default] 当前研发阶段
scope: flow-stage
key: *
project: *

### 实际工作中的使用
阶段视图用于观察当前阶段中的工作包、状态和上下游关系。

## [flow-package-default] 当前工作包流程
scope: flow-package
key: *
project: *

### 实际工作中的使用
- 文件节点与任务节点按真实依赖连接。
- 未开始和进行中的任务可编辑；已完成任务保留追溯记录。
- Agent快捷条提供分析、调研和DOE任务；连接点的新建菜单还提供结果文件、实验、模拟计算等类型。

## [page-management] 管理成员和审批规则
scope: page
key: management
project: *

### 实际工作中的使用
- 左侧管理成员并指定项目负责人、Leader、+1、+2；右侧配置流程变更、工作流转和项目审批。
- 各类规则按阶段、子阶段、工作包、任务分别勾选，工作流转区分启动和完成；审批链按角色顺序处理，同一人员合并。

### 演示建议
为任务完成或流程变更勾选Leader并保存，再到工作台或工作流提交操作。四层矩阵已提供配置，阶段/子阶段独立启动等拦截尚未接入。

## [page-approvals] 从审批人的视角处理申请
scope: page
key: approvals
project: *

### 实际工作中的使用
- 待我审批、我已处理、我发起的集中展示项目事项；详情说明谁在什么项目申请了什么变化。
- 先查看原因、差异和审批链，可预览流程、进入节点工作台并返回，再通过或填写原因驳回。

### 演示建议
默认林晓有3条待审示例。选择BLT要求变更可体验两级审批；切换王宁查看SOP待审。示例申请仅更新审批记录，不改变研发进度；实际发起申请通过后才应用关联操作。

## [workbench-P1T1-TODO-001] 补全项目基础信息
scope: workbench
key: P1T1-TODO-001
project: *

### 实际工作中的使用
Agent确认需求、约束和预期产出，整理到“项目基础信息.md”，由用户确认后启动技术调研。

### 演示建议
新项目发送任意背景说明即可生成演示草稿；查看信息确认卡片后启动调研。内置示例的立项记录已完成，可供回看。

## [workbench-P1T2-TODO-001] 梳理技术路线与证据缺口
scope: workbench
key: P1T2-TODO-001
project: *

### 实际工作中的使用
技术调研Agent围绕基础信息梳理技术路径、参考依据和待补充证据。

### 演示建议
两个调研TODO并行进行。完成本任务后继续“形成技术调研报告”，不会提前完成整个工作包。

## [workbench-P1T2-TODO-002] 形成技术调研报告
scope: workbench
key: P1T2-TODO-002
project: *

### 实际工作中的使用
汇总技术路线、约束和证据，形成报告供立项材料准备使用。

### 演示建议
打开本对话产生的Markdown资产；关闭文档回到“节点资产”，点击“完成任务”继续推进。

## [workbench-P1T3-TODO-001] 立项材料与项目审批
scope: workbench
key: P1T3-TODO-001
project: *

### 实际工作中的使用
立项材料准备完成后，项目按配置的审批角色确认目标、资源和交付边界。

### 演示建议
新项目完成本任务时会提醒立项需要审批，点击“模拟审批通过并继续”即可进入SOP节点，并保留演示审批记录。

## [workbench-P1T4-TODO-001] 确认SOP研发规划
scope: workbench
key: P1T4-TODO-001
project: *

### 实际工作中的使用
SOP规划按普通“流程变更—阶段”规则审核，一份申请覆盖整套研发规划。

### 演示建议
未配置审批时直接确认并生成研发阶段1；配置后先到审批中心通过，再生成研发流程。审批详情可预览待发布规划。

## [flow-stage-P1] 项目立项流程
scope: flow-stage
key: P1
project: *

### 实际工作中的使用
按需求确认、技术调研、项目立项、SOP审批组织工作包；前序交付用于后续安排。

### 演示建议
示例项目的立项已完成，可双击查看历史任务。新建项目可体验从需求确认到审批、生成研发流程的连续过程。

## [default] 认识当前工作区
scope: default
key: *
project: *

### 实际工作中的使用
这个原型把导热凝胶项目流程、Agent对话、任务资产、ELN和计算工作区放在同一个连续环境中。

### 演示说明
当前内容仅用于产品交互演示，数据保存在浏览器本地，未连接真实AI、科学计算服务或后端数据库。

## [workbench-T30-TODO-001] 固化与样件制备
scope: workbench
key: T30-TODO-001
project: *

### 实际工作中的使用
在实验 ELN 中记录固化窗口、样件编号及用途分配，保证热学、可靠性与留样可追溯。

### 演示建议
切换“节点资产”和“实验 ELN”页签。填写的是演示记录，任务提交完成与实验是否通过是不同判断。

## [workbench-T41-TODO-001] 可靠性与界面实验
scope: workbench
key: T41-TODO-001
project: *

### 实际工作中的使用
按批次和时点整理可靠性及微观界面记录，保留未验证项、异常和后续安排。

### 演示建议
从实验任务进入 ELN 查看记录结构。若配置完成审批，提交后到审批中心审核，再继续流转。

## [workbench-T50-TODO-001] 中试一致性验证
scope: workbench
key: T50-TODO-001
project: *

### 实际工作中的使用
在获准范围内组织10—50kg中试，记录批次、过程条件和小批对照证据。

### 演示建议
查看 ELN 与资产如何关联；审批中心“中试启动”示例用于讨论前置条件，不代表实际已经批准中试。
