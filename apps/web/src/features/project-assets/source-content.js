/* Read-only source copies for the high-thermal-conductivity gel demo case. */
const AssetSourceContent={
  'workflow.md':`# 导热凝胶项目推进工作流

版本：thermal_gal / v0.2-draft.1  
日期：2026-11-11

本演示项目围绕高导热凝胶从需求与资源对齐、材料与级配、小试混炼、固化薄层、热学可靠性、中试资格到质量监督的完整研发流程展开。

## 目标
- 建立可追溯的配方、工艺和样品谱系。
- 联合评估体相导热率、表观导热率、BLT、接触热阻与可靠性。
- 为 10–50 kg 中试和资格确认形成受控输入。

## 技术路线
- A：双峰级配基线。
- B：三峰级配与细粉优化。
- C：片状填料增强。
- R：四峰级配、粉体前处理与 V-PDMS 推荐路线。

> 以上内容用于原型演示，不代表真实实验已经执行或指标已经达成。`,
  'sop.md':`# 高导热凝胶研发 SOP 摘要

## 关键控制
1. 锁定原料批号、粒径分布、表面处理和含水率。
2. 按受控顺序完成填料预混、聚合物加入、真空脱泡和罐装。
3. 记录混炼扭矩、温度、真空度、时间和环境状态。
4. 以 D5470 方法联合记录 κ_app、BLT 与 2Rc，并保留原始曲线。
5. 完成热循环、老化和界面可靠性后再进入中试资格。

本文件为演示摘要，实际执行须由项目团队确认版本和设备条件。`,
  'formulations.json':JSON.stringify({project:'高导热凝胶开发',routes:['A 双峰级配','B 三峰级配','C 片状填料增强','R 四峰级配+粉体前处理+V-PDMS'],metrics:['κ_bulk','κ_app','BLT','2Rc','Shore 00'],status:'prototype-demo'},null,2),
  'evidence.json':JSON.stringify({source:'run-02/thermal_gal',version:'v0.2-draft.1',date:'2026-11-11',note:'原型演示数据；未连接真实实验、科学计算或后端服务。'},null,2)
};
