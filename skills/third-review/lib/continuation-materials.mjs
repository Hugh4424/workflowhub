import { fail } from "./errors.mjs";

const bindingFields = ["sequence", "bundle_id", "manifest_hash", "delivery_manifest_hash", "initial_material_manifest_hash", "previous_delivery_manifest_hash"];
const sameBinding = (left, right) => bindingFields.every((field) => left?.[field] === right?.[field]);

export function lastProviderMaterial(state, provider, session_id) {
  if (typeof session_id !== "string" || !session_id) fail("MATERIAL_INCOMPLETE", "continuation has no native provider session");
  const completed = state.continuation_materials ?? [];
  for (let index = completed.length - 1; index >= 0; index -= 1) if (completed[index]?.provider_sessions?.[provider] === session_id) return completed[index];
  return null;
}
export function providerHasContinuationPredecessor(state, provider, session_id, sequence) {
  if (sequence === 1) return true;
  if (!Number.isSafeInteger(sequence) || sequence < 1 || typeof session_id !== "string" || !session_id) return false;
  const predecessor = (state.continuation_materials ?? []).find((item) => item.sequence === sequence - 1);
  return predecessor?.provider_sessions?.[provider] === session_id;
}
export function reserveContinuationMaterial(state, material, provider, session_id) {
  if (!material || typeof material.bundle_id !== "string" || !material.bundle_id || typeof session_id !== "string" || !session_id) fail("MATERIAL_INCOMPLETE", "continuation material lacks a bundle or verified session");
  const completed = state.continuation_materials ?? []; const reservation = state.continuation_reservation;
  if (!reservation && completed.length !== material.sequence - 1) fail("MATERIAL_INCOMPLETE", "continuation sequence is no longer available");
  if (reservation && !sameBinding(reservation, material)) fail("MATERIAL_INCOMPLETE", "continuation material is reserved by another request");
  if (reservation?.provider_sessions?.[provider] && reservation.provider_sessions[provider] !== session_id) fail("MATERIAL_INCOMPLETE", "continuation provider/session is reserved by another request");
  return { ...state, continuation_reservation: { ...(reservation ?? material), provider_sessions: { ...(reservation?.provider_sessions ?? {}), [provider]: session_id } } };
}
export function releaseContinuationMaterial(state, material, provider, session_id) {
  const reservation = state.continuation_reservation;
  if (!material || typeof session_id !== "string" || !session_id || !reservation || !sameBinding(reservation, material) || reservation.provider_sessions?.[provider] !== session_id) return state;
  const provider_sessions = { ...reservation.provider_sessions }; delete provider_sessions[provider];
  return { ...state, continuation_reservation: Object.keys(provider_sessions).length ? { ...reservation, provider_sessions } : null };
}
export function recordContinuationMaterial(state, material, provider, session_id) {
  const completed = state.continuation_materials ?? []; const reservation = state.continuation_reservation;
  if (!reservation || !sameBinding(reservation, material) || reservation.provider_sessions?.[provider] !== session_id) fail("MATERIAL_INCOMPLETE", "continuation material has no matching reservation");
  const provider_sessions = { ...reservation.provider_sessions }; delete provider_sessions[provider]; const nextReservation = Object.keys(provider_sessions).length ? { ...reservation, provider_sessions } : null; const existing = completed.find((item) => item.sequence === material.sequence);
  if (existing) {
    if (!sameBinding(existing, material)) fail("MATERIAL_INCOMPLETE", "continuation sequence was already bound to different material");
    return { ...state, continuation_materials: completed.map((item) => item.sequence === material.sequence ? { ...item, provider_sessions: { ...item.provider_sessions, [provider]: session_id } } : item), continuation_reservation: nextReservation };
  }
  if (completed.length !== material.sequence - 1) fail("MATERIAL_INCOMPLETE", "continuation sequence cannot be appended out of order");
  return { ...state, continuation_materials: [...completed, { ...material, provider_sessions: { [provider]: session_id } }], continuation_reservation: nextReservation };
}
