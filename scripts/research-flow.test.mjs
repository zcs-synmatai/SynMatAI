import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const code = await readFile(new URL('../apps/web/src/features/research-flow/data.js', import.meta.url), 'utf8');
const data = vm.runInNewContext(code + '\nJSON.parse(JSON.stringify(researchFlowData))');

test('review plan preserves six stages and exactly 21 authoritative business tasks', () => {
  assert.equal(data.stages.length, 6);
  assert.equal(data.tasks.length, 21);
  assert.equal(new Set(data.tasks.map(t => t.id)).size, 21);
  assert.deepEqual(Array.from(data.stages, s => data.tasks.filter(t => t.stage === s.id).length), [4, 6, 3, 3, 3, 2]);
  for (const task of data.tasks) {
    assert.equal(task.method, '人工');
    assert.ok(task.scope && task.input && task.condition && task.role);
    assert.ok(data.workflow.includes(task.id + ' ' + task.name));
    assert.ok(task.deliverables.length > 0);
  }
});

test('parallel verification and evidence convergence retain their source dependencies', () => {
  for (const [stage, edges] of Object.entries(data.edges)) {
    for (const [from, to] of edges) {
      assert.equal(data.tasks.find(t => t.id === from)?.stage, stage);
      assert.equal(data.tasks.find(t => t.id === to)?.stage, stage);
    }
  }
  const has = (a, b) => data.edges.S2.some(e => e[0] === a && e[1] === b);
  assert.ok(has('T23', 'T24') && has('T23', 'T25'));
  assert.ok(!has('T24', 'T25') && !has('T25', 'T24'));
  assert.ok(['T21', 'T23', 'T24', 'T25'].every(id => has(id, 'T26')));
  assert.equal(data.tasks.find(t => t.id === 'T33').deliverables.map(d => d.id).join(','), 'D33,D34');
  assert.equal(data.tasks.find(t => t.id === 'T53').deliverables.map(d => d.id).join(','), 'D53,D54');
  assert.equal(data.tasks.flatMap(t => t.deliverables).length, 24);
});

test('reference information is inspectable without introducing phantom tasks', () => {
  assert.equal(data.routes.length, 4);
  assert.equal(data.ops.length, 10);
  assert.equal(data.questions.length, 8);
  for (const op of data.ops) assert.ok(op.excerpt.trim().startsWith('#'));
  assert.ok(data.tasks.every(t => /^T\d{2}$/.test(t.id)));
  assert.ok(data.visual.includes(data.sourceHash.toUpperCase()));
});
