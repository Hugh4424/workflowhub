import { createCanonicalReceiptWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";

/** Execute tests and publish an authority-bound canonical receipt. */
export async function runCapture(command, receiptRef, { workspace, task, outputRef, now } = {}) {
  const receiptName = String(receiptRef ?? "").replace(/^quality\/tests\//, "").replace(/\.json$/, "").replaceAll("/", "-");
  const currentOutputRef = outputRef ?? (task?.manifest?.record_model === "vnext-single-write"
    ? `quality/tests/output/${receiptName}.output`
    : `evidence/${receiptName}.output`);
  return createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "build-code-test-capture", now })
    .captureTests({ command, receiptRef, outputRef: currentOutputRef });
}
