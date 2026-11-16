/* Select the overview profile for the active project without migrating older project data. */
const OverviewModel=new Proxy({}, {
 get(_target,key){
  const project=typeof ProjectStore!=='undefined'?ProjectStore.active():null;
  const model=project?.templateVersion==='thermal-gel-v2'?ThermalGelOverviewModel:LegacyCoatingOverviewModel;
  return model[key];
 },
 ownKeys(){
  const project=typeof ProjectStore!=='undefined'?ProjectStore.active():null;
  return Reflect.ownKeys(project?.templateVersion==='thermal-gel-v2'?ThermalGelOverviewModel:LegacyCoatingOverviewModel);
 },
 getOwnPropertyDescriptor(){return {enumerable:true,configurable:true}}
});
