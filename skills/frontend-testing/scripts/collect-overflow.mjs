import {fileURLToPath} from 'node:url';
import {collectWith,runCollectorCli,failure} from './collect-console.mjs';
export {failure};
export function collect(value) {
  if(!value||!Number.isFinite(value.scrollWidth)||!Number.isFinite(value.clientWidth))throw new Error('Geometry observation missing');
  return {scrollWidth:value.scrollWidth,clientWidth:value.clientWidth};
}
const collectOverflow=(config,env)=>collectWith(config,env,async({evaluate,doc})=>{
  doc.items.push(collect(await evaluate('({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})')));
});
export const runCli=(argv=process.argv.slice(2),env=process.env)=>runCollectorCli(argv,env,collectOverflow);
if(process.argv[1]===fileURLToPath(import.meta.url))process.exitCode=await runCli();
