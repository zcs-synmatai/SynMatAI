import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const base=new URL('../apps/web/src/features/research-flow/',import.meta.url);
const code=(await Promise.all(['draft-model.js','canvas-model.js'].map(name=>readFile(new URL(name,base),'utf8')))).join('\n');
const model=vm.runInNewContext(code+'\nFlowCanvasModel',{structuredClone});
const near=(a,b)=>assert.ok(Math.abs(a-b)<.000001,`${a} != ${b}`);
test('zoom remains anchored at the pointer and clamps at both scale limits',()=>{
 const before={x:-340,y:130,zoom:.7},pointer={x:553,y:205},world=model.worldPoint(before,pointer);
 for(const z of [.1,.85,8]){const next=model.zoomAt(before,z,pointer),after=model.worldPoint(next,pointer);near(after.x,world.x);near(after.y,world.y);assert.ok(next.zoom>=.25&&next.zoom<=1.6)}
 assert.equal(before.zoom,.7);
});
test('fit centers a scene with negative coordinates inside the available view',()=>{
 const b={x:-400,y:-100,width:1800,height:600},camera=model.fit(b,1000,700,60);
 near(camera.x+(b.x+b.width/2)*camera.zoom,500);near(camera.y+(b.y+b.height/2)*camera.zoom,350);
 assert.ok(camera.x+b.x*camera.zoom>=59.99);assert.ok(camera.x+(b.x+b.width)*camera.zoom<=940.01);
 assert.ok(Number.isFinite(model.fit({x:0,y:0,width:0,height:0},0,0).zoom));
});
test('manual node positions survive relayout without changing task dependencies',()=>{
 const tasks=[{id:'a'},{id:'b'},{id:'c'}],edges=[['a','b'],['a','c']],saved={b:{x:-800,y:1200},c:{x:NaN,y:0}},before=JSON.stringify(edges);
 const p=model.positions(tasks,edges,saved);assert.equal(p.b.x,-800);assert.equal(p.b.y,1200);assert.ok(Number.isFinite(p.c.x));assert.ok(p.a.x<p.c.x);assert.equal(JSON.stringify(edges),before);
 const b=model.bounds(p,{a:{width:208,height:200},b:{width:208,height:200},c:{width:208,height:200}});assert.ok(b.x<-800);assert.ok(b.y+b.height>1400);
});


test('four-side curve anchors and tangent directions follow the chosen ports',()=>{
 const a={x:100,y:200,width:208,height:180},b={x:600,y:420,width:208,height:180};
 for(const side of ['left','right','top','bottom']){
  const curve=model.curve(a,b,side,side),start=model.port(a,side),end=model.port(b,side);
  assert.ok(curve.d.includes(' C'));assert.ok(!/[HLV]/.test(curve.d));
  near(curve.points[0].x,start.x);near(curve.points[0].y,start.y);near(curve.points[3].x,end.x);near(curve.points[3].y,end.y);
  if(side==='left')assert.ok(curve.points[1].x<start.x);
  if(side==='right')assert.ok(curve.points[1].x>start.x);
  if(side==='top')assert.ok(curve.points[1].y<start.y);
  if(side==='bottom')assert.ok(curve.points[1].y>start.y);
 }
});
test('evidence connections remain continuous curves even after nodes cross or move to negative space',()=>{
 const curve=model.curve({x:800,y:-900,width:208,height:180},{x:-700,y:1200,width:208,height:180},'bottom','top',true);
 assert.ok(curve.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 assert.ok(Number.isFinite(curve.label.x)&&Number.isFinite(curve.label.y));
 assert.ok(curve.d.startsWith('M904,-720 C'));
});
test('dropping near a node chooses the nearest actual side connection point',()=>{
 const r={x:100,y:100,width:200,height:180};
 assert.equal(model.nearestPort({x:98,y:190},r),'left');assert.equal(model.nearestPort({x:302,y:190},r),'right');assert.equal(model.nearestPort({x:200,y:98},r),'top');assert.equal(model.nearestPort({x:200,y:282},r),'bottom');
});

test('marquee selection works in either drag direction and excludes nonintersecting nodes',()=>{
 const p={a:{x:-20,y:10},b:{x:150,y:40},c:{x:500,y:80}},sizes={a:{width:100,height:90},b:{width:80,height:100},c:{width:80,height:100}};
 for(const box of [{x:-30,y:0,width:280,height:160},{x:250,y:160,width:-280,height:-160}])assert.equal(JSON.stringify(model.nodesWithin(box,p,sizes)),JSON.stringify(['a','b']));
 const bounds=model.selectionBounds(['a','b','missing'],p,sizes);assert.equal(JSON.stringify(bounds),JSON.stringify({x:-20,y:10,width:250,height:130}));assert.equal(model.selectionBounds([],p,sizes),null);
});

test('flow streaks retain one screen length and speed independently of zoom or edge length',()=>{
 for(const zoom of [.25,.6,1,1.6]){const pattern=model.flowPattern(zoom);near(pattern.dash*zoom,20);near(pattern.gap*zoom,130);near(pattern.offset*zoom,-150)}
});

test('new dependent nodes find free space beside their predecessors without covering existing nodes',()=>{
 const positions={a:{x:0,y:0},b:{x:340,y:0},c:{x:680,y:0},d:{x:340,y:304}},sizes=Object.fromEntries(Object.keys(positions).map(id=>[id,{width:244,height:224}]));
 const point=model.newNodePosition(['a'],['b'],positions,sizes);
 for(const r of Object.values(positions))assert.ok(point.x+244+60<=r.x||r.x+244+60<=point.x||point.y+224+60<=r.y||r.y+224+60<=point.y);
 assert.ok(point.x>positions.a.x+244);assert.equal(positions.b.y,0);
 const empty=model.newNodePosition([],[],{},{});assert.ok(Number.isFinite(empty.x)&&Number.isFinite(empty.y));
});

test('automatic layout aligns the vertical centers of cards with different heights',()=>{
 const tasks=[{id:'a'},{id:'b'},{id:'c'}],sizes={a:{height:180},b:{height:225},c:{height:200}},p=model.positions(tasks,[['a','b'],['b','c']],{},sizes);
 near(p.a.y+90,p.b.y+112.5);near(p.b.y+112.5,p.c.y+100);
 const saved=model.positions(tasks,[['a','b'],['b','c']],{a:{x:55,y:63}},sizes);assert.equal(saved.a.y,63);
});

test('drag snapping aligns edges or centers within eight screen pixels and preserves grouped offsets',()=>{
 const positions={a:{x:0,y:0},b:{x:100,y:180},c:{x:400,y:240}},sizes={a:{width:80,height:80},b:{width:80,height:80},c:{width:80,height:80}};
 const snap=model.snapMove(['a'],{a:positions.a},{x:96,y:0},positions,sizes,1);assert.equal(snap.delta.x,100);assert.ok(snap.guides.some(g=>g.axis==='x'&&g.coordinate===100));assert.equal(snap.delta.y,0);
 const far=model.snapMove(['a'],{a:positions.a},{x:86,y:0},positions,sizes,1);assert.equal(far.delta.x,86);
 const zoomed=model.snapMove(['a'],{a:positions.a},{x:86,y:0},positions,sizes,.5);assert.equal(zoomed.delta.x,100);
 const group=model.snapMove(['a','b'],{a:positions.a,b:positions.b},{x:216,y:0},positions,sizes,1);assert.equal(group.delta.x,220);assert.equal(positions.a.x,0);assert.equal(positions.b.x,100);
});

test('automatic ports face adjacent cards after horizontal, vertical and reversed layouts',()=>{
 const a={x:100,y:100,width:244,height:150};
 for(const [b,from,to] of [[{x:450,y:100,width:244,height:150},'right','left'],[{x:100,y:400,width:244,height:150},'bottom','top'],[{x:-250,y:100,width:244,height:150},'left','right'],[{x:100,y:-200,width:244,height:150},'top','bottom']]){
  const ports=model.bestPorts(a,b);assert.equal(ports.fromPort,from);assert.equal(ports.toPort,to);
  const c=model.curve(a,b,ports.fromPort,ports.toPort);assert.ok(c.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 }
});

test('forward layout keeps consumers to the right and stacks parallel tasks without overlaps',()=>{
 const tasks=[{id:'file',canvasKind:'input'},...Array.from({length:8},(_,i)=>({id:'task'+i})),{id:'merge'},{id:'isolated'}],edges=[...tasks.filter(t=>t.id.startsWith('task')).map(t=>['file',t.id]),...tasks.filter(t=>t.id.startsWith('task')).map(t=>[t.id,'merge'])],sizes=Object.fromEntries(tasks.map((t,i)=>[t.id,{width:244,height:t.id==='file'?64:118+i*3}]));
 const before=JSON.stringify(edges),p=model.forwardPositions(tasks,edges,sizes);
 for(const [a,b] of edges){assert.ok(p[b].x>p[a].x+sizes[a].width);const ports=model.bestPorts({...p[a],...sizes[a]},{...p[b],...sizes[b]},[],true);assert.ok(['right','bottom'].includes(ports.fromPort));assert.ok(['left','top'].includes(ports.toPort))}
 for(let i=0;i<tasks.length;i++)for(let j=i+1;j<tasks.length;j++){const a=tasks[i].id,b=tasks[j].id;assert.ok(p[a].x+sizes[a].width<=p[b].x||p[b].x+sizes[b].width<=p[a].x||p[a].y+sizes[a].height<=p[b].y||p[b].y+sizes[b].height<=p[a].y)}
 assert.equal(JSON.stringify(edges),before);assert.equal(new Set(tasks.filter(t=>t.id.startsWith('task')).map(t=>p[t.id].x)).size,1);
});

test('barycenter ordering uncrosses inverted parallel dependencies without changing topology',()=>{
 const tasks=['a','b','c','d'].map(id=>({id})),edges=[['a','d'],['b','c']],before=JSON.stringify(edges),p=model.forwardPositions(tasks,edges);
 assert.ok((p.a.y-p.b.y)*(p.d.y-p.c.y)>0);assert.equal(JSON.stringify(edges),before);
 for(const [a,b] of edges){const ports=model.bestPorts({...p[a],width:244,height:150},{...p[b],width:244,height:150},[],true);assert.equal(ports.fromPort,'right');assert.equal(ports.toPort,'left')}
});

test('edge style depends on relationship meaning rather than the presence of a file label',()=>{
 for(const label of ['文件输入','产出文件','传递产出物','结果文件'])assert.equal(model.edgeKind(['a','b',label]),'dependency');
 assert.equal(model.edgeKind(['a','b','施工窗证据']),'evidence');assert.equal(model.edgeKind(['a','b','文件输入','evidence']),'evidence');assert.equal(model.edgeKind(['a','b']),'dependency');
});


test('exact drag placement uses pointer as top-left even near occupied nodes after pan and zoom',()=>{
 for(const camera of [{x:0,y:0,zoom:1},{x:-410,y:170,zoom:.63},{x:280,y:-90,zoom:1.4}]){
  const pointer={x:580,y:340},point=model.worldPoint(camera,pointer);
  const placed=model.newNodePosition([],[],{occupied:{...point}},{occupied:{width:244,height:118}},{width:244,height:240},point,true);
  near(placed.x*camera.zoom+camera.x,pointer.x);near(placed.y*camera.zoom+camera.y,pointer.y);
 }
});


test('global overview may fit a whole expanded project below ordinary working zoom',()=>{
 const box={x:80,y:220,width:3500,height:240},camera=model.fit(box,700,500,34,.12);
 assert.ok(camera.zoom<.25);assert.ok(camera.x+box.x*camera.zoom>=33.99);assert.ok(camera.x+(box.x+box.width)*camera.zoom<=666.01);
 assert.equal(model.fit(box,700,500,34).zoom,.25);
});
