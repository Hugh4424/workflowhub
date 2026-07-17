const AUTHORITIES = new WeakSet();

export function createDoctorAuthority(inspect) {
  if (typeof inspect !== "function") throw new TypeError("doctor inspect function is required");
  const authority = Object.freeze({ inspect });
  AUTHORITIES.add(authority);
  return authority;
}

export async function runDoctorCommand(authority) {
  if (!AUTHORITIES.has(authority)) throw new TypeError("authentic doctor authority required");
  const result = await authority.inspect();
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new TypeError("doctor result must be an object");
  const factsRefs = result.facts_refs ?? [];
  if (!Array.isArray(factsRefs)) throw new TypeError("doctor facts_refs must be canonical refs");
  for (const ref of factsRefs) assertCanonicalRef(ref, "doctor facts ref");
  const nextAction = result.next_action ?? (result.ok === false ? "repair runtime" : "none");
  if (!new Set(["none", "repair runtime"]).has(nextAction)) throw new TypeError("doctor next_action is invalid");
  return Object.freeze({
    status: result.ok === false ? "blocked" : "available",
    facts_refs: Object.freeze([...factsRefs]),
    next_action: nextAction,
  });
}
import { assertCanonicalRef } from "./launcher-authority.mjs";
