import {fileURLToPath} from 'node:url';
import {collectWith,runCollectorCli,failure} from './collect-console.mjs';
export {failure};
const timingKeys=['ttfb','domContentLoadedEventEnd','loadEventEnd'];
const numeric=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
const unknown=value=>numeric(value)?value:'unknown';
export function collect({nav={},measures=null,longTasks=null}={}) {
  const output={nav:{},interaction:{status:'unknown',measures:[]},long_tasks:{count:'unknown',max_ms:'unknown'}};
  for(const key of timingKeys){const runs=(nav[key]??[]).filter(numeric);output.nav[key]={runs:[...runs],median:runs.length===3?[...runs].sort((a,b)=>a-b)[1]:'unknown'};}
  if(Array.isArray(measures)){
    output.interaction.measures=measures.map(m=>({name:m.name,duration:unknown(m.duration)}));
    if(measures.length&&measures.every(m=>numeric(m.duration)))output.interaction.status='measured';
  }
  if(Array.isArray(longTasks)&&longTasks.every(t=>numeric(t.duration))){const long=longTasks.map(t=>t.duration).filter(n=>n>50);output.long_tasks={count:long.length,max_ms:long.length?Math.max(...long):'unknown'};}
  return output;
}
function loaded(cdp,sessionId) {
  let settle;const promise=new Promise(resolve=>{settle=resolve;});
  const remove=cdp.onEvent(e=>{if(e.sessionId===sessionId&&e.method==='Page.loadEventFired')settle(true);});
  const disconnected=cdp.onDisconnect(()=>settle(false));const timer=setTimeout(()=>settle(false),3000);
  return {promise,close(){clearTimeout(timer);remove();disconnected();settle(false);}};
}
async function observedTask(call,cdp,evaluate,runTask) {
  const opened=await call('Runtime.evaluate',{expression:"(()=>{const entries=[];const observer=typeof PerformanceObserver==='function'?new PerformanceObserver(list=>entries.push(...list.getEntries().map(e=>({duration:e.duration})))):null;try{observer?.observe({type:'longtask',buffered:false});performance.clearMarks('c07:act-start');performance.clearMarks('c07:act-end');performance.clearMeasures('c07:act');performance.mark('c07:act-start');return {entries,observer,timer:setTimeout(()=>observer?.disconnect(),35000)};}catch(error){observer?.disconnect();throw error;}})()",returnByValue:false});
  const objectId=opened?.result?.objectId;
  if(opened?.exceptionDetails||!objectId)throw Error('Interaction observer could not be started');
  let observation,problem,stopWatching,lost=false;
  const disconnected=new Promise((resolve,reject)=>{stopWatching=cdp.onDisconnect(()=>{lost=true;reject(Error('Page task connection lost'));});});
  const invoke=async functionDeclaration=>{const r=await call('Runtime.callFunctionOn',{objectId,functionDeclaration,returnByValue:true,awaitPromise:true});if(r?.exceptionDetails||!r?.result||!Object.hasOwn(r.result,'value'))throw Error('Interaction observation unavailable');return r.result.value;};
  try {
    try{if(lost)throw Error('Page task connection lost');await Promise.race([Promise.resolve().then(()=>runTask({evaluate})),disconnected]);}catch{throw Error('Page task execution failed');}
    observation=await invoke("async function(){performance.mark('c07:act-end');const measured=performance.measure('c07:act','c07:act-start','c07:act-end');await new Promise(resolve=>setTimeout(resolve,0));if(this.observer)this.entries.push(...this.observer.takeRecords().map(e=>({duration:e.duration})));return {measures:[{name:measured.name,duration:measured.duration}],long_tasks:this.observer?this.entries:null};}");
  }catch(error){problem=error;}
  finally {
    try{await invoke('function(){clearTimeout(this.timer);this.observer?.disconnect();return true;}');}catch(error){problem??=error;}
    try{await call('Runtime.releaseObject',{objectId});}catch(error){problem??=error;}
    stopWatching();
  }
  if(problem)throw problem;
  return observation;
}
// Module callers supply an already-owned domain action closure; no transport or
// task registry crosses this seam. CLI has no default action to fabricate.
export const collectPerf=(config,env,runTask)=>collectWith(config,env,async({cdp,call,sessionId,target,doc,evaluate,isDisconnected})=>{
  const facts={nav:Object.fromEntries(timingKeys.map(k=>[k,[]]))};
  const item={state:doc.object.state,viewport:doc.object.viewport,perf:collect(facts)};
  doc.items.push(item);
  await call('Page.enable');await call('Performance.enable');
  try {
    // Cache this document's action/long-task facts BEFORE any navigation can
    // destroy its state or Performance timeline. Navigation owns only nav[].
    try {
      if(runTask!==undefined&&typeof runTask!=='function')throw Error('Page task must be a function');
      const observation=runTask?await observedTask(call,cdp,evaluate,runTask):await evaluate("(async()=>{/* c07:perf-read */const entries=[];const observer=typeof PerformanceObserver==='function'?new PerformanceObserver(list=>entries.push(...list.getEntries().map(e=>({duration:e.duration})))):null;try{observer?.observe({type:'longtask',buffered:true});await new Promise(resolve=>setTimeout(resolve,0));if(observer)entries.push(...observer.takeRecords().map(e=>({duration:e.duration})));return {measures:[],long_tasks:observer?entries:null};}finally{observer?.disconnect();}})()");
      if(!observation||!Array.isArray(observation.measures))throw Error('Interaction observation missing');
      if(runTask)facts.measures=observation.measures;
      facts.longTasks=observation.long_tasks;
    }catch(error){if(isDisconnected())throw error;doc.failures.push(failure('TOOL_ERROR',error.message));}
    for(let run=0;run<3;run++){
      const load=loaded(cdp,sessionId);
      try {
        const navigation=await call('Page.navigate',{url:target.url});
        if(navigation.errorText)throw new Error('Navigation failed');
        if(!await load.promise)throw new Error('Navigation load observation unavailable');
        const values=await evaluate("(()=>{const n=performance.getEntriesByType('navigation')[0];return n?{ttfb:n.responseStart-n.requestStart,domContentLoadedEventEnd:n.domContentLoadedEventEnd,loadEventEnd:n.loadEventEnd}:null;})()");
        for(const key of timingKeys)if(numeric(values?.[key]))facts.nav[key].push(values[key]);
      }finally{load.close();}
    }
  }finally {item.perf=collect(facts);}
});
export const runCli=(argv=process.argv.slice(2),env=process.env,runTask)=>runCollectorCli(argv,env,(config,env)=>collectPerf(config,env,runTask));
if(process.argv[1]===fileURLToPath(import.meta.url))process.exitCode=await runCli();
