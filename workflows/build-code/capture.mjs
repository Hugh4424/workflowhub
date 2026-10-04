// MT3-132: private workflow entry to the existing command fact interface ②.
// Caller supplies explicit cwd/recordDir/slug and argv or shell; the interface
// retains actual exit/output/failure/cancellation facts without stage permits.
export { captureCommand as runCapture } from "../../runtime/interface/run-command.mjs";
