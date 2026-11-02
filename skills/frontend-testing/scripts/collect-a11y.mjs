import {fileURLToPath} from 'node:url';
import {collectWith,runCollectorCli,failure} from './collect-console.mjs';
export {failure};
export function collect(tree) {
  if(!Array.isArray(tree?.nodes))throw new Error('Accessibility tree missing');
  return tree.nodes.map(node=>({node_id:node.nodeId,role:node.role?.value??'unknown',name:node.name?.value??'unknown',focusable:node.properties?.find(p=>p.name==='focusable')?.value?.value??'unknown'}));
}
const collectA11y=(config,env)=>collectWith(config,env,async({call,doc})=>{
  await call('Accessibility.enable');
  doc.items.push(...collect(await call('Accessibility.getFullAXTree')));
});
export const runCli=(argv=process.argv.slice(2),env=process.env)=>runCollectorCli(argv,env,collectA11y);
if(process.argv[1]===fileURLToPath(import.meta.url))process.exitCode=await runCli();
