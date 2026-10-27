#!/usr/bin/env node
import { lstatSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export function systemOpenCommand(platform, filePath) {
 if(platform==='darwin')return {command:'open',args:[filePath]};
 // cmd parses its own grammar even with shell:false. The target is never command text.
 if(platform==='win32')return {command:'cmd',args:['/d','/v:off','/s','/c','start "" "%WH_PAGE_TARGET%"']};
 if(platform==='linux')return {command:'xdg-open',args:[filePath]};
 throw Error(`unsupported system browser platform: ${platform}`);
}
// The task-aware caller needs a confirmed tab operation, not LaunchServices exit0.
const REUSE_BROWSER_SCRIPT=String.raw`ObjC.import('AppKit');
const env=$.NSProcessInfo.processInfo.environment, value=k=>ObjC.unwrap(env.objectForKey(k));
const target=value('WH_PAGE_URL'),marker='#workflowhub-task='+encodeURIComponent(value('WH_PAGE_IDENTITY')),scope=value('WH_PAGE_TASK_ROOT');
const sameTask=url=>{const at=url.indexOf('#workflowhub-task=');return at>=0?url.slice(at)===marker&&url.startsWith(scope):url.split('#')[0]===target.split('#')[0];};
const override=value('WH_PAGE_BROWSER_APPLICATION');
const appURL=override?$.NSURL.fileURLWithPath(override):$.NSWorkspace.sharedWorkspace.URLForApplicationToOpenURL($.NSURL.fileURLWithPath(value('WH_PAGE_TARGET')));
if(!appURL)throw Error('没有可查询的默认HTML应用');
const appPath=ObjC.unwrap(appURL.path),bundle=ObjC.unwrap($.NSBundle.bundleWithURL(appURL).bundleIdentifier);
if(!/Chrome|Chromium|edgemac|brave/i.test(bundle))throw Error('默认浏览器未提供本入口可验证的标签API：'+bundle);
const expected=value('WH_PAGE_BROWSER_PID');
if(expected){const instances=$.NSRunningApplication.runningApplicationsWithBundleIdentifier(bundle),matching=[];for(let i=0;i<Number(instances.count);i++){const instance=instances.objectAtIndex(i);if(ObjC.unwrap(instance.bundleURL.path)===appPath)matching.push(instance);}if(matching.length!==1||Number(matching[0].processIdentifier)!==Number(expected))throw Error('owned浏览器进程身份不唯一或不匹配');}
const app=Application(appPath);if(!app.running())app.launch();
const windows=app.windows();let match=null,window=null;
for(const w of windows){for(const t of w.tabs()){if(sameTask(t.url())){match=t;window=w;break;}}if(match)break;}
let action;
if(match){match.url=target;action='refreshed';}
else{if(!windows.length)app.Window().make();window=app.windows()[0];const tab=app.Tab({url:target});window.tabs.push(tab);window.activeTabIndex=window.tabs.length;match=window.tabs[window.tabs.length-1];action='opened';}
if(match.url()!==target)throw Error('标签URL读回不匹配');
JSON.stringify({opened:true,action,browser:appPath,url:target});`;

export async function openInSystemBrowser(filePath,{platform=process.platform,run=spawnSync,taskIdentity,taskRoot,browserApplication,browserPid,pageUrl}={}) {
 const path=resolve(filePath),stat=lstatSync(path);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error(`browser target must be a real regular file: ${path}`);
 if(taskIdentity){
  if(platform!=='darwin')throw Error('当前平台未提供可验证的同任务浏览器标签复用能力');
  const display=new URL(pageUrl??pathToFileURL(path).href);
  if(pageUrl&&(!['http:','https:'].includes(display.protocol)||!['127.0.0.1','localhost','[::1]'].includes(display.hostname)))throw Error('显式页面URL只允许具名loopback预览');
  display.hash='workflowhub-task='+encodeURIComponent(taskIdentity);const targetUrl=display.href;
  const env={...process.env,WH_PAGE_TARGET:path,WH_PAGE_URL:targetUrl,WH_PAGE_TASK_ROOT:pageUrl?new URL('.',display).href:pathToFileURL(resolve(taskRoot??dirname(path))+sep).href,WH_PAGE_IDENTITY:taskIdentity,WH_PAGE_BROWSER_APPLICATION:browserApplication??'',WH_PAGE_BROWSER_PID:browserPid?String(browserPid):''};
  const result=run('osascript',['-l','JavaScript','-e',REUSE_BROWSER_SCRIPT],{shell:false,encoding:'utf8',timeout:10000,env});
  if(result.error)throw result.error;if(result.status!==0)throw Error('浏览器标签复用失败：'+String(result.stderr??'exit='+result.status).trim());
  let confirmation;try{confirmation=JSON.parse(result.stdout);}catch{throw Error('浏览器操作结果未取得，无法确认已打开或刷新');}
  if(confirmation.opened!==true||!['opened','refreshed'].includes(confirmation.action)||confirmation.url!==targetUrl)throw Error('浏览器操作结果无法确认目标页面');
  return confirmation;
 }
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
