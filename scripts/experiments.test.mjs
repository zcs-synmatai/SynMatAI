import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source = readFileSync(new URL('../apps/web/src/features/experiments/model.js', import.meta.url), 'utf8');
const M = vm.runInNewContext(`${source}\nExperimentModel`, { Date, JSON, Set });

test('明确实验单与SOP计划板数采用不同粒度', () => {
  const s = M.seed();
  assert.equal(s.experiments.length, 14);
  assert.equal(s.experiments.filter(e => e.stage === 'S2').length, 8);
  assert.equal(s.experiments.filter(e => ['S3', 'S4', 'S5', 'S6'].includes(e.stage)).length, 0);
  assert.equal(s.experiments.filter(e => e.phase === '量产').length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(M.counts(s))), {
    experiments: 14, coatedPanels: 96, blankPanels: 24, prepGroups: 12, layerBatches: 15,
  });
});

test('R3的P0/P1实验引用同三组制备批和受控空白，不重复算批次', () => {
  const s = M.seed();
  const [p0, p1] = M.filter(s, { phase: '研发', stage: 'S2', route: 'R3' });
  assert.equal(p0.pre, 'P0');
  assert.equal(p1.pre, 'P1');
  assert.deepEqual(p0.groupIds, p1.groupIds);
  assert.equal(p1.groupIds.length, 3);
  assert.equal(p1.controlIds.length, 12);
  assert.equal(s.groups[p1.groupIds[0]].layers.length, 2);
  assert.notEqual(p0.sampleIds[0], p1.sampleIds[0]);
  assert.equal(M.delivery(s, p1).missing.some(q => q.type === '沸水'), true);
});

test('测量修订不自动推进状态，完成必须负责人填写意见', () => {
  const s = M.seed();
  const e = s.experiments.find(x => x.id === 'EXP-012');
  const q = M.delivery(s, e).missing.find(x => s.groups[x.groupId].registered);
  const before = e.status;
  M.addMeasurement(s, e, { ...q, value: '本地演示观测' }, 'tester', 'wang');
  assert.equal(e.status, before);
  assert.equal(M.delivery(s, e).measured, 3);
  assert.throws(() => M.transition(s, e, '待分析', 'owner', 'lin'), /测量记录尚未齐全/);
});

test('待明确阶段不能未经人工冻结条件就纳入实验列表', () => {
  const s = M.seed();
  const d = { id: 'DRAFT-test', name: '已有实验', goal: '验证已有目标', stage: 'S3', route: 'R1', pre: 'P0', schemeVersion: 'v1.0', executor: 'zhang', tester: 'wang', expected: '初始', batches: 1, source: '用户登记', missing: [] };
  assert.throws(() => M.promoteDraft(s, d, 'owner'), /人工填写已冻结条件/);
  assert.equal(s.experiments.length, 14);
});

test('四路线相容小试共享T12来源，列表按项目节点顺序恢复排列', () => {
  const s = M.seed();
  const four = M.filter(s, { stage: 'S1', node: 'T12' });
  assert.deepEqual(Array.from(four, e => e.route), ['R1', 'R2', 'R3', 'R4']);
  assert.ok(four.every(e => e.name.startsWith('层液相容小试')));
  const before = four.map(e => e.id).join();
  s.experiments.reverse();
  assert.equal(M.filter(s, { node: 'T12' }).map(e => e.id).join(), before);
  assert.equal(M.sourceNode(M.filter(s, { stage: 'S2' })[0]), 'T22');
  const e = four[0], recorded = e.id;
  e.name = 'R1平衡单层相容小试'; delete e.nodeId;
  M.upgrade(s);
  assert.equal(e.id, recorded);
  assert.equal(e.nodeId, 'T12');
  assert.equal(e.name, '层液相容小试 · R1 平衡单层');
});
