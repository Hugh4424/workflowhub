// MT3-133: private workflow entry to the existing command fact interface ②.
// Caller supplies explicit cwd/recordDir/slug and argv or shell; the interface
// retains actual exit/output/failure/cancellation facts without stage permits.
export { captureCommand as runPrivateTargetedCapture } from "../../runtime/interface/run-command.mjs";
