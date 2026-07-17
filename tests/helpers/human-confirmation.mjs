export function writeHumanConfirmation(kernel, stage, attempt, decision = "accepted") {
  const attemptRef = typeof attempt === "string" ? attempt : attempt.attempt_ref;
  return kernel.confirmAttempt(stage, attemptRef, decision).ref;
}
