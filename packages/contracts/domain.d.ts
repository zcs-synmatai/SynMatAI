export type NodeStatus = 'idle' | 'running' | 'done' | 'stale';
export type NodeKind = 'micro' | 'macro' | 'schedule' | 'analysis';
export interface WorkflowNode {
  id: string;
  type: NodeKind;
  name: string;
  status: NodeStatus;
  version: number;
}
export interface MaterialNode extends WorkflowNode {
  type: 'micro';
  material: string;
  /** Kelvin. */
  temp: number;
  steps: number;
  /** Thermal conductivity, W/(m K). */
  value: number | null;
}
export interface ComponentNode extends WorkflowNode {
  type: 'macro';
  /** Upstream material node IDs, one per material region. */
  bindings: string[];
  /** Boundary temperatures in Celsius. */
  hot: number;
  cold: number;
}
export interface DocumentTodo {
  id: string;
  name: string;
  status: 'todo' | 'progress' | 'done';
  owner: string;
  /** Prototype uses a local Asia/Shanghai datetime or an empty string. */
  due: string;
  priority: 'normal' | 'high';
  nodeId: string;
}
export interface AssetMetadata {
  name: string;
  type: string;
  nodeIds?: string[];
}
