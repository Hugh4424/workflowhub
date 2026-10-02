import {execFileSync} from "node:child_process";
import {lstatSync,realpathSync,mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {join,relative,resolve,isAbsolute} from "node:path";
import {compactReviewDiff} from "../../../runtime/review/review-input-bounds.mjs";
function git(root,args){const env={...process.env};for(const key of Object.keys(env))if(key.startsWith("GIT_"))delete env[key];env.GIT_OPTIONAL_LOCKS="0";return execFileSync("git",args,{cwd:root,env,encoding:"utf8",maxBuffer:64*1024*1024,stdio:["ignore","pipe","pipe"]});}
/** Capture explicit source Git facts and a selected diff. No worktree/tree copy,
 * private snapshot commit, canonical receipt, or freshness permission is made. */
export function captureReviewSource({sourceRoot,workspace=null,targetRepoRoot=null,baselineCommit=null,reviewDataRoot,includeDiff=true,writeSet=null}={}) {
 const root=resolve(sourceRoot ?? workspace?.worktreeRoot);if(realpathSync(root)!==root||!lstatSync(root).isDirectory())throw new Error("SOURCE_UNAVAILABLE: source path alias or not directory");
 const top=realpathSync(git(root,["rev-parse","--show-toplevel"]).trim());if(top!==root)throw new Error("SOURCE_UNAVAILABLE: exact Git worktree root required");
 const capturedHead=git(root,["rev-parse","--verify","HEAD"]).trim();const base=baselineCommit ?? workspace?.baselineCommit ?? capturedHead;git(root,["cat-file","-e",`${base}^{commit}`]);
 const result={sourceRoot:root,targetRepoRoot:targetRepoRoot ?? root,capturedHead,baseCommit:base,dispose(){}};
 if(!includeDiff)return result;
 const data=resolve(reviewDataRoot);if(realpathSync(data)!==data||!lstatSync(data).isDirectory())throw new Error("SOURCE_UNAVAILABLE: real review data root required");
 const temporary=mkdtempSync(join(data,"review-source-"));
 try {const text=git(root,["diff","--binary",base,"--"]);const diff=compactReviewDiff(text,{writeSet}).diff;const diffPath=join(temporary,"changes.diff");writeFileSync(diffPath,diff,{flag:"wx",mode:0o600});return {...result,diffPath,diffBytes:Buffer.byteLength(diff),dispose(){rmSync(temporary,{recursive:true,force:true});}};}
 catch(error){rmSync(temporary,{recursive:true,force:true});throw error;}
}
