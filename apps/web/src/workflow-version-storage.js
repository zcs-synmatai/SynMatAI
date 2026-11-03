/* Seed the frozen workflow once before the active app can write V3 changes. */
const FlowVersionStorage=(()=>{
 const prefix='workflow-v2::',marker=prefix+'seeded';
 function seedV2(){try{if(localStorage.getItem(marker))return;const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('synmat-'))keys.push(key)}for(const key of keys)if(localStorage.getItem(prefix+key)===null)localStorage.setItem(prefix+key,localStorage.getItem(key));localStorage.setItem(marker,'1')}catch{/* Storage may be unavailable; each app still keeps its own in-memory state. */}}
 const v2={getItem:key=>localStorage.getItem(prefix+key),setItem:(key,value)=>localStorage.setItem(prefix+key,value),removeItem:key=>localStorage.removeItem(prefix+key)};
 seedV2();return {seedV2,v2};
})();
