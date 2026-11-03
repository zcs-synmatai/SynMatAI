/* Camera math is separate from task definitions and execution progress. */
const FlowCanvasModel = (() => {
 const clamp=z=>Math.max(.25,Math.min(1.6,Number.isFinite(z)?z:1));
 const worldPoint=(camera,point)=>({x:(point.x-camera.x)/camera.zoom,y:(point.y-camera.y)/camera.zoom});
 function zoomAt(camera,zoom,point){const world=worldPoint(camera,point),z=clamp(zoom);return {x:point.x-world.x*z,y:point.y-world.y*z,zoom:z}}
 function fit(bounds,width,height,padding=64){const zoom=clamp(Math.min((Math.max(1,width)-padding*2)/Math.max(1,bounds.width),(Math.max(1,height)-padding*2)/Math.max(1,bounds.height),1));return {x:width/2-(bounds.x+bounds.width/2)*zoom,y:height/2-(bounds.y+bounds.height/2)*zoom,zoom}}
 function positions(tasks,edges,saved={},sizes={}){const layout=FlowDraft.layout(tasks,edges),result={},rowHeight=Math.max(224,...tasks.map(t=>sizes[t.id]?.height||224));for(const t of tasks){const p=layout.positions[t.id],stored=saved[t.id];result[t.id]=stored&&Number.isFinite(stored.x)&&Number.isFinite(stored.y)?{x:stored.x,y:stored.y}:{x:100+(p.column-1)*300,y:180+((p.rowEnd-p.rowStart>1?(layout.rows-1)/2:p.rowStart-1))*260+(rowHeight-(sizes[t.id]?.height||rowHeight))/2}}return result}
 const edgeKind=edge=>edge[3]||(!edge[2]||['文件输入','产出文件','传递产出物','结果文件'].includes(edge[2])?'dependency':'evidence');
 function forwardPositions(tasks,edges,sizes={}){
  const layout=FlowDraft.layout(tasks,edges),connected=new Set(edges.flatMap(e=>e.slice(0,2))),groups=new Map(),isolated=[],result={};
  for(const t of tasks){if(!connected.has(t.id)){isolated.push(t);continue}const rank=layout.positions[t.id].column;if(!groups.has(rank))groups.set(rank,[]);groups.get(rank).push(t)}
  const ranks=[...groups.keys()].sort((a,b)=>a-b),nodeRank=new Map(tasks.map(t=>[t.id,layout.positions[t.id].column]));
  // Alternating barycenter sweeps align parallel branches before assigning coordinates.
  for(let sweep=0;sweep<8;sweep++){
   const down=sweep%2===0,order=down?ranks:[...ranks].reverse();
   for(const rank of order){const group=groups.get(rank),stable=new Map(group.map((t,i)=>[t.id,i]));
    const center=t=>{const neighbors=edges.filter(e=>down?e[1]===t.id:e[0]===t.id).map(e=>down?e[0]:e[1]);const points=neighbors.map(id=>{const peers=groups.get(nodeRank.get(id));return peers?(peers.findIndex(t=>t.id===id)+.5)/peers.length:null}).filter(v=>v!==null);return points.length?points.reduce((a,b)=>a+b,0)/points.length:(stable.get(t.id)+.5)/group.length};
    const centers=new Map(group.map(t=>[t.id,center(t)]));group.sort((a,b)=>centers.get(a.id)-centers.get(b.id)||stable.get(a.id)-stable.get(b.id));
   }
  }
  const height=t=>sizes[t.id]?.height||150,width=t=>sizes[t.id]?.width||244,colHeight=g=>g.reduce((n,t)=>n+height(t),0)+Math.max(0,g.length-1)*48,maxHeight=Math.max(0,...ranks.map(r=>colHeight(groups.get(r))));let x=100;
  for(const rank of ranks){const group=groups.get(rank);let y=180+(maxHeight-colHeight(group))/2;for(const t of group){result[t.id]={x,y};y+=height(t)+48}x+=Math.max(...group.map(width))+112}
  let y=180+maxHeight+(ranks.length?96:0);for(const t of isolated){result[t.id]={x:100,y};y+=height(t)+48}
  return result;
 }
 function bounds(positions,sizes={}){const ids=Object.keys(positions);if(!ids.length)return {x:0,y:0,width:600,height:300};const left=Math.min(...ids.map(id=>positions[id].x))-40,top=Math.min(...ids.map(id=>positions[id].y))-100,right=Math.max(...ids.map(id=>positions[id].x+(sizes[id]?.width||208)))+40,bottom=Math.max(...ids.map(id=>positions[id].y+(sizes[id]?.height||180)))+100;return {x:left,y:top,width:right-left,height:bottom-top}}
 const directions={left:{x:-1,y:0},right:{x:1,y:0},top:{x:0,y:-1},bottom:{x:0,y:1}};
 function port(rect,side){return side==='left'?{x:rect.x,y:rect.y+rect.height/2}:side==='top'?{x:rect.x+rect.width/2,y:rect.y}:side==='bottom'?{x:rect.x+rect.width/2,y:rect.y+rect.height}:{x:rect.x+rect.width,y:rect.y+rect.height/2}}
 function nearestPort(point,rect){return Object.keys(directions).sort((a,b)=>{const p=port(rect,a),q=port(rect,b);return Math.hypot(point.x-p.x,point.y-p.y)-Math.hypot(point.x-q.x,point.y-q.y)})[0]}
 function curve(from,to,fromSide='right',toSide='left',evidence=false){
  const p0=port(from,fromSide),p3=port(to,toSide),a=directions[fromSide]||directions.right,b=directions[toSide]||directions.left,span=Math.hypot(p3.x-p0.x,p3.y-p0.y),bend=Math.max(65,Math.min(evidence?420:240,span*(evidence ? .36 : .45))),p1={x:p0.x+a.x*bend,y:p0.y+a.y*bend},p2={x:p3.x+b.x*bend,y:p3.y+b.y*bend};
  return {d:`M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,points:[p0,p1,p2,p3],label:{x:(p0.x+3*p1.x+3*p2.x+p3.x)/8,y:(p0.y+3*p1.y+3*p2.y+p3.y)/8-10}};
 }
 function bestPorts(from,to,obstacles=[],forward=false){
  const sides=Object.keys(directions),cx=r=>r.x+r.width/2,cy=r=>r.y+r.height/2;
  const dx=cx(to)-cx(from),dy=cy(to)-cy(from);
  const preferred=forward&&to.x>=from.x+from.width?['right','left']:Math.abs(dx)/(from.width+to.width)>=Math.abs(dy)/(from.height+to.height)?[dx>=0?'right':'left',dx>=0?'left':'right']:[dy>=0?'bottom':'top',dy>=0?'top':'bottom'];
  let best=null;
  for(const a of sides)for(const b of sides){
   if(forward&&(to.y>=from.y+from.height||to.x>=from.x+from.width)&&(!['right','bottom'].includes(a)||!['left','top'].includes(b)))continue;
   const c=curve(from,to,a,b),points=c.points;let score=(a===preferred[0]&&b===preferred[1]?0:(forward?180:35)),previous=points[0];
   for(let i=1;i<=24;i++){const t=i/24,u=1-t,p={x:u*u*u*points[0].x+3*u*u*t*points[1].x+3*u*t*t*points[2].x+t*t*t*points[3].x,y:u*u*u*points[0].y+3*u*u*t*points[1].y+3*u*t*t*points[2].y+t*t*t*points[3].y};score+=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;
    if(i<24)for(const r of [from,to,...obstacles])if(p.x>r.x-4&&p.x<r.x+r.width+4&&p.y>r.y-4&&p.y<r.y+r.height+4)score+=120;
   }
   if(!best||score<best.score)best={fromPort:a,toPort:b,score};
  }
  return {fromPort:best.fromPort,toPort:best.toPort};
 }
 function selectionBounds(ids,positions,sizes){const valid=ids.filter(id=>positions[id]&&sizes[id]);if(!valid.length)return null;const x=Math.min(...valid.map(id=>positions[id].x)),y=Math.min(...valid.map(id=>positions[id].y)),right=Math.max(...valid.map(id=>positions[id].x+sizes[id].width)),bottom=Math.max(...valid.map(id=>positions[id].y+sizes[id].height));return {x,y,width:right-x,height:bottom-y}}
 function nodesWithin(box,positions,sizes){const x=Math.min(box.x,box.x+box.width),y=Math.min(box.y,box.y+box.height),right=Math.max(box.x,box.x+box.width),bottom=Math.max(box.y,box.y+box.height);return Object.keys(positions).filter(id=>sizes[id]&&positions[id].x<right&&positions[id].x+sizes[id].width>x&&positions[id].y<bottom&&positions[id].y+sizes[id].height>y)}
 function newNodePosition(predecessors,successors,positions,sizes,size={width:244,height:224},preferred=null,exact=false){
  if(exact&&Number.isFinite(preferred?.x)&&Number.isFinite(preferred?.y))return {x:preferred.x,y:preferred.y};
  const rect=id=>({...positions[id],width:sizes[id]?.width||244,height:sizes[id]?.height||224}),before=predecessors.filter(id=>positions[id]).map(rect),after=successors.filter(id=>positions[id]).map(rect),occupied=Object.keys(positions).map(rect);
  let x=before.length?Math.max(...before.map(p=>p.x+p.width))+96:occupied.length?Math.max(...occupied.map(p=>p.x+p.width))+96:600;
  if(preferred&&Number.isFinite(preferred.x))x=preferred.x;
  const y=preferred&&Number.isFinite(preferred.y)?preferred.y:before.length?before.reduce((sum,p)=>sum+p.y+p.height/2,0)/before.length-size.height/2:215;
  if(before.length&&after.length){const end=Math.min(...after.map(p=>p.x));if(end-x>size.width+80)x=(x+end-size.width)/2}
  const free=p=>occupied.every(r=>p.x+size.width+60<=r.x||r.x+r.width+60<=p.x||p.y+size.height+60<=r.y||r.y+r.height+60<=p.y);
  for(let ring=0;ring<200;ring++){const candidates=ring===0?[{x,y}]:[{x,y:y+ring*(size.height+80)},{x,y:y-ring*(size.height+80)},{x:x+ring*(size.width+96),y}];const point=candidates.find(free);if(point)return point}
  return {x:Math.max(x,...occupied.map(r=>r.x+r.width))+96,y};
 }
 function snapMove(ids,starts,delta,positions,sizes,zoom){
  const box=selectionBounds(ids,starts,sizes);if(!box)return {delta,guides:[]};const moving={x:box.x+delta.x,y:box.y+delta.y,width:box.width,height:box.height},others=Object.keys(positions).filter(id=>!ids.includes(id)&&sizes[id]).map(id=>({...positions[id],...sizes[id]})),threshold=8/clamp(zoom),guides=[],adjust={x:0,y:0};
  for(const axis of ['x','y']){const dimension=axis==='x'?'width':'height',other=axis==='x'?'y':'x',otherSize=axis==='x'?'height':'width';let best=null;
   for(const target of others)for(const a of [0,.5,1])for(const b of [0,.5,1]){const coordinate=target[axis]+target[dimension]*b,distance=coordinate-(moving[axis]+moving[dimension]*a);if(Math.abs(distance)<=threshold&&(!best||Math.abs(distance)<Math.abs(best.distance)))best={distance,coordinate,target}}
   if(best){adjust[axis]=best.distance;guides.push({axis,coordinate:best.coordinate,from:Math.min(moving[other],best.target[other])-40,to:Math.max(moving[other]+moving[otherSize],best.target[other]+best.target[otherSize])+40})}
  }
  return {delta:{x:delta.x+adjust.x,y:delta.y+adjust.y},guides};
 }
 function flowPattern(zoom){const z=clamp(zoom);return {dash:20/z,gap:130/z,offset:-150/z}}
 return {clamp,worldPoint,zoomAt,fit,positions,edgeKind,forwardPositions,bounds,port,nearestPort,curve,bestPorts,selectionBounds,nodesWithin,newNodePosition,snapMove,flowPattern};
})();
