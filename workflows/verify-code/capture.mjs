import { createCanonicalReceiptWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";

// The local stage runner is only an outcome transport helper. Test receipts
// remain owned by this canonical capture writer.
/** Independently execute the accepted command and publish canonical evidence. */
export async function runCapture(command, receiptRef, { workspace, task, outputRef, now } = {}) {
  const receiptName = String(receiptRef ?? "").replace(/^quality\/tests\//, "").replace(/\.json$/, "").replaceAll("/", "-");
  const currentOutputRef = outputRef ?? (task?.manifest?.record_model === "vnext-single-write"
    ? `quality/tests/output/${receiptName}.output`
    : `evidence/${receiptName}.output`);
  return createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "verify-code-test-capture", now })
    .captureTests({ command, receiptRef, outputRef: currentOutputRef });
}
