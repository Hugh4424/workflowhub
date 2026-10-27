#!/usr/bin/env node
import { lstatSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function systemOpenCommand(platform, filePath) {
 if(platform==='darwin')return {command:'open',args:[filePath]};
 // cmd parses its own grammar even with shell:false. The target is never command text.
 if(platform==='win32')return {command:'cmd',args:['/d','/v:off','/s','/c','start "" "%WH_PAGE_TARGET%"']};
 if(platform==='linux')return {command:'xdg-open',args:[filePath]};
 throw Error(`unsupported system browser platform: ${platform}`);
}
export async function openInSystemBrowser(filePath,{platform=process.platform,run=spawnSync}={}) {
 const path=resolve(filePath),stat=lstatSync(path);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error(`browser target must be a real regular file: ${path}`);
 const {command,args}=systemOpenCommand(platform,path);
 const options={shell:false,encoding:'utf8',timeout:10000,windowsHide:true};
 if(platform==='win32') {
  // Windows names are case-insensitive. Replace every inherited spelling in this child only.
  const env={...process.env};
  for(const key of Object.keys(env))if(key.toUpperCase()==='WH_PAGE_TARGET')delete env[key];
  env.WH_PAGE_TARGET=path;
  options.env=env;options.windowsVerbatimArguments=true;
 }
 const result=run(command,args,options);
 if(result.error)throw result.error;
 if(result.status!==0)throw Error(`${command} exit=${result.status} signal=${result.signal??'none'}: ${String(result.stderr??'').trim()}`);
 return true;
}
export async function main(argv=process.argv.slice(2)){if(argv.length!==1)throw Error('usage: open-page.mjs <HTML file>');return {opened:await openInSystemBrowser(argv[0])};}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
