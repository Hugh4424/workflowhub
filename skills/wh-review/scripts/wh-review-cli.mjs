#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
import {runSimpleReview} from "./simple-review-runner.mjs";
import {recordSimpleReviewRequest} from "../../../runtime/review/review-record-route.mjs";
import {redactProviderHostPaths} from "../../../runtime/review/provider-material-projection.mjs";
import {verifyFinal} from "./review-runner.mjs";
import {loadTrustedThirdReviewConfig,validateAllWhReviewRoutes} from "./third-review-host-config.mjs";
import {reviewIdentityFromInput} from "../../../runtime/review/review-policy.mjs";

export async function runReviewRecovery(input,{runRound=runReviewRound,signal=null,sameSourceFallback=null}={}) {
  if(!input || typeof input!=="object" || Array.isArray(input)) throw new TypeError("review input is required");
  if(sameSourceFallback!==null) throw new TypeError("sameSourceFallback is retired; broker owns provider recovery");
  const identity=reviewIdentityFromInput(input);
  const request={...input,stage:identity.stage,review_track:identity.reviewTrack,review_scope:identity.reviewScope,review_kind:identity.reviewKind};
  if(input.taskDir ?? input.task_dir) return recordSimpleReviewRequest({taskDir:input.taskDir ?? input.task_dir,request,runRound,signal});
  // Bare invocations remain one actual call, with no hash sink/history lookup.
  return runRound(request,{...(signal ? {signal} : {})});
}
export async function runReviewRound(input,options={}) {return runSimpleReview(input,options);}
export function verifyFinalReview(input) {return verifyFinal({taskDir:input.taskDir ?? input.task_dir,resultRef:input.result_ref ?? input.resultRef,taskId:input.task_id ?? null,stage:input.stage ?? null,reviewTrack:input.review_track ?? input.reviewTrack});}
export function doctorThirdReviewConfig() {const trusted=loadTrustedThirdReviewConfig();validateAllWhReviewRoutes(trusted.whReview);return {status:"ok",stages:Object.keys(trusted.whReview?.stages ?? {})};}
async function main() {
  const command=process.argv[2];if(!["run","verify-final","doctor"].includes(command)) throw new Error("usage: wh-review-cli.mjs <run|verify-final|doctor> [input.json]");
  if(command==="doctor") {process.stdout.write(JSON.stringify(doctorThirdReviewConfig())+"\n");return;}
  const input=JSON.parse(readFileSync(process.argv[3] ?? 0,"utf8"));const controller=new AbortController();let exit=null;
  const interrupt=code=>()=>{if(!controller.signal.aborted){exit=code;controller.abort(Object.assign(new Error("review interrupted"),{code:"REVIEW_CANCELLED"}));}};
  const int=interrupt(130),term=interrupt(143);process.on("SIGINT",int);process.on("SIGTERM",term);
  try {const result=command==="run" ? await runReviewRecovery(input,{signal:controller.signal}) : verifyFinalReview(input);process.stdout.write(JSON.stringify(redactProviderHostPaths(result))+"\n");if(result.status==="unavailable" || result.status==="incomplete") process.exitCode=1;}
  finally {process.removeListener("SIGINT",int);process.removeListener("SIGTERM",term);if(exit!==null) process.exitCode=exit;}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(error=>{process.stderr.write(JSON.stringify(redactProviderHostPaths({code:error.code ?? "REVIEW_ERROR",message:error.message}))+"\n");process.exitCode=1;});
