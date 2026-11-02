import {fileURLToPath} from 'node:url';
import {collectWith,stream,runCollectorCli,failure,collect as collectEvent} from './collect-console.mjs';
export {failure,stream as window};
export const collect=(event,window={})=>collectEvent(event,window);
const collectNetwork=(config,env)=>collectWith(config,env,context=>stream(context,'network',collect));
export const runCli=(argv=process.argv.slice(2),env=process.env)=>runCollectorCli(argv,env,collectNetwork);
if(process.argv[1]===fileURLToPath(import.meta.url))process.exitCode=await runCli();
