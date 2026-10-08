// 退役登记见 docs/architecture/move-map.json 本文件条目（ADR-037）：零非测试消费者，owner 确认前不删。
const STAGES=new Set(["make-decision","build-plan","build-code","verify-code","build-prd"]);
const STATUSES=new Set(["fixed","rejected_invalid","accepted_risk","needs_human","user_decided"]);
function object(value,label){if(!value||typeof value!=="object"||Array.isArray(value))throw new TypeError(`${label} must be an object`);return value;}
function text(value,label){if(typeof value!=="string"||!value.trim())throw new TypeError(`${label} must be non-empty`);return value;}
export function isActionableSeriousFinding(finding){return ["major","blocking"].includes(finding?.severity)&&[undefined,"actionable"].includes(finding.disposition)&&(["direct","corroborated_inference"].includes(finding.evidence_status)||["direct","machine"].includes(finding.evidence_kind));}
export function canonicalReviewFindings(result){if(Object.hasOwn(result ?? {},"findings")){if(!Array.isArray(result.findings))throw new TypeError("review findings must be an array");return result.findings;}return result?.adjudication?.clusters ?? [];}
/** Pure human-facing disposition facts; no snapshot/card/receipt hash gates,
 * workflow-run identity, ledger writes, completion license or automatic retry. */
export function validateReportableFindingDispositions({result,dispositions,authorizedRiskFindingIds=[],userReply=undefined}={}) {
 if(!result)return {facts:{status:"unknown",items:[]},missing_items:["review result is missing"]};
 if(["unavailable","incomplete","unknown"].includes(result.status))return {facts:{status:result.status,items:[]},missing_items:["review has no trusted semantic terminal result"]};
 const findings=canonicalReviewFindings(result);const ids=[...new Set(findings.map((f,index)=>f.id ?? `finding-${index+1}`))];
 if(!ids.length)return {facts:{status:"not_applicable",items:[]},missing_items:[]};
 if(dispositions===undefined)return {facts:{status:"incomplete",items:[]},missing_items:[`finding disposition is missing for: ${ids.join(", ")}`]};
 if(!Array.isArray(dispositions))throw new TypeError("finding_dispositions must be an array");
 const seen=new Set(),missing=[],items=[];const authorized=new Set(authorizedRiskFindingIds);
 for(const item of dispositions){object(item,"finding disposition");const id=text(item.finding_id,"finding_id");if(seen.has(id)||!ids.includes(id))throw new Error(`unknown or duplicate finding disposition: ${id}`);seen.add(id);if(!STATUSES.has(item.status))throw new Error(`invalid finding disposition status: ${item.status}`);
  for(const field of ["original_fact","source","consequence","next_action"])text(item[field],field);
  if(item.status==="accepted_risk"){const actual=userReply && userReply.finding_id===id && typeof userReply.reply==="string" && userReply.reply.trim() && typeof userReply.reply_ref==="string" && userReply.reply_ref.trim();if(!authorized.has(id)||!actual)missing.push(`accepted_risk requires a real user risk reply for ${id}`);}
  if(item.status==="needs_human")missing.push(`finding ${id} still needs a real user decision`);
  if(item.status==="user_decided"){const reply=object(userReply,"user reply");if(reply.finding_id!==id)throw new Error("user reply finding mismatch");text(reply.reply,"verbatim user reply");text(reply.reply_ref,"user reply ref");if(item.source!=="user_reply")throw new Error("user_decided requires source=user_reply");}
  items.push({...item});
 }
 for(const id of ids)if(!seen.has(id))missing.push(`finding disposition is missing for ${id}`);
 return {facts:{status:missing.length?"incomplete":"recorded",items},missing_items:missing};
}
export function deriveSeriousReviewPause({taskId,stage,reviewRef,result,reviewAttempt}={}) {
 text(taskId,"taskId");if(!STAGES.has(stage))throw new TypeError("unsupported stage");
 if(result===undefined){object(reviewAttempt,"unavailable review attempt");return {status:"unavailable",task_id:taskId,stage,findings:[]};}
 const review=object(result,"review result");if(review.task_id!==taskId||review.stage!==stage)throw new Error("review task/stage mismatch");text(reviewRef,"reviewRef");
 if(["unavailable","incomplete","unknown"].includes(review.status))return {status:review.status,task_id:taskId,stage,review_ref:reviewRef,findings:[]};
 if(!["available","available-with-failures"].includes(review.status))return {status:"unknown",task_id:taskId,stage,review_ref:reviewRef,findings:[]};
 const findings=canonicalReviewFindings(review).filter(isActionableSeriousFinding).map((f,index)=>({finding_id:f.id ?? `finding-${index+1}`,severity:f.severity,issue:text(f.issue,"finding issue"),review_ref:reviewRef,impact_scope:[f.path ?? "current delivery"],consequences:[`该问题可能影响 ${f.path ?? "当前交付"}；真实安全保护必须保留。`],options:[{id:"repair",label:"先修复",recommended:true,reason:"消除已证问题",consequence:"修复后继续当前任务",risk:"需要修改与必要验证"},{id:"accept-risk",label:"接受具体风险",recommended:false,reason:"仅限明确可承担的后果",consequence:"保留该问题的真实事实",risk:"可能返工或错误；不能取消真实安全保护"}]}));
 return {status:findings.length?"needs_human":"recorded",task_id:taskId,stage,review_ref:reviewRef,findings};
}
export function buildRiskAcceptance({pause,findingId,selectedOption,replyRef,reply,acceptedAt}={}) {
 const state=object(pause,"review questions");const finding=state.findings?.find(f=>f.finding_id===findingId);if(!finding)throw new Error("risk finding not in current questions");if(selectedOption!=="accept-risk")throw new Error("explicit accept-risk option required");text(reply,"verbatim user reply");text(replyRef,"replyRef");if(!Number.isFinite(Date.parse(acceptedAt)))throw new Error("risk reply time invalid");
 return {task_id:state.task_id,stage:state.stage,review_ref:state.review_ref,finding_id:findingId,issue:finding.issue,impact_scope:[...finding.impact_scope],consequences:[...finding.consequences],selected_option:selectedOption,reply_ref:replyRef,reply,accepted_at:acceptedAt};
}
export function validateRiskAcceptance({acceptance,pause}={}) {const value=object(acceptance,"risk reply fact");const expected=buildRiskAcceptance({pause,findingId:value.finding_id,selectedOption:value.selected_option,replyRef:value.reply_ref,reply:value.reply,acceptedAt:value.accepted_at});for(const key of ["task_id","stage","review_ref","finding_id","issue","impact_scope","consequences"])if(JSON.stringify(value[key])!==JSON.stringify(expected[key]))throw new Error(`risk reply scope mismatch: ${key}`);return value;}
export function validateRiskAcceptanceSet({acceptances,pause}={}) {if(!Array.isArray(acceptances))throw new TypeError("risk replies must be an array");const seen=new Set();for(const value of acceptances){validateRiskAcceptance({acceptance:value,pause});if(seen.has(value.finding_id))throw new Error("duplicate risk finding");seen.add(value.finding_id);}const missing=(pause.findings ?? []).filter(f=>!seen.has(f.finding_id));if(missing.length)throw new Error("risk replies do not cover every actual serious finding");return acceptances;}
