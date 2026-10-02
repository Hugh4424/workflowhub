import {readFileSync,lstatSync,realpathSync} from "node:fs";
import {isAbsolute,join,relative,resolve} from "node:path";
const AC=/\bAC-[A-Za-z0-9][A-Za-z0-9_-]*\b/g;
export function buildAcEvidenceSummary({taskDir=null,acceptanceCriteria,acceptanceEvidence=[]}={}) {
 if(typeof acceptanceCriteria!=="string"||!acceptanceCriteria.trim())throw new Error("MATERIAL_INCOMPLETE: acceptance_criteria must be text");
 const ids=[...new Set(acceptanceCriteria.match(AC) ?? [])];if(!ids.length)throw new Error("MATERIAL_INCOMPLETE: acceptance_criteria has no AC ids");
 const evidence=Array.isArray(acceptanceEvidence)?acceptanceEvidence:acceptanceEvidence?.leaves ?? acceptanceEvidence?.criteria ?? [];
 if(!Array.isArray(evidence))throw new Error("MATERIAL_INCOMPLETE: acceptance evidence must be observations");
 const rows=ids.map(id=>{const observations=evidence.filter(x=>(x?.acceptance_criterion_id ?? x?.id)===id);return {acceptance_criterion_id:id,status:observations.length?"observed":"unknown",observations:observations.map(x=>({...x}))};});
 return {criteria:rows,coverage_limits:["Supplied observations only; missing quality stays unknown. No snapshot or receipt permits are inferred."]};
}
