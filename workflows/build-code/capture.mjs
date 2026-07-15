import { createCanonicalReceiptWriter } from "../../core/canonical-receipt-writer.mjs";

/** Execute tests and publish an authority-bound canonical receipt. */
export async function runCapture(command, receiptRef, { workspace, task, outputRef = "evidence/build-code-tests.output", now } = {}) {
  return createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "build-code-test-capture", now })
    .captureTests({ command, receiptRef, outputRef });
}
