import { createCanonicalReceiptWriter } from "../../core/canonical-receipt-writer.mjs";

/** Independently execute the accepted command and publish canonical evidence. */
export async function runCapture(command, receiptRef, { workspace, task, outputRef = "evidence/verify-code-tests.output", now } = {}) {
  return createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "verify-code-test-capture", now })
    .captureTests({ command, receiptRef, outputRef });
}
