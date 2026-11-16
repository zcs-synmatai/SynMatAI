/*
 * Select once per page load. Project switches reload the page, so a concrete
 * value is sufficient and remains compatible with structuredClone().
 * Keeping this as a Proxy makes the flow bootstrap fail before its workspace
 * listeners are registered because browser Proxies are not cloneable.
 */
const researchFlowData=(()=>{
 const project=typeof ProjectStore!=='undefined'?ProjectStore.active():null;
 return project?.templateVersion==='thermal-gel-v2'?thermalGelFlowData:legacyCoatingFlowData;
})();
