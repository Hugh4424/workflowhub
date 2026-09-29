# P10 old-tree target RED input reconstruction

This file documents a **post-run reconstruction**, not a test file saved at the time of the RED run.

- Current final test source: `tests/contract/build-code-case-selection.test.mjs`, SHA-256 `ee740418c5488b0b9540a8646485e6dcc92265d1f76f307343ae6540fa832608` when reconstructed.
- Earlier source: `before-case-selection.test.mjs`, SHA-256 `a99b7b914cd975b0f34be44ccafac5c384294c2d2224086d4cba5c6171fcdea0`.
- Reconstruction: take the final test bytes and replace exactly one negative-control call's second line, `fixture), "invalid_change_provenance");`, with the earlier call's `{ variants: [v, unrelated] }), "invalid_change_provenance");`. No other bytes change. The final test has the bound-inventory positive control; the reconstructed RED input leaves the negative control on the old unbound inventory.
- Reconstructed file: `red-input-reconstructed.test.mjs`, SHA-256 `a8dad274a0680d798a791a8d92e94bc83d6ddd4dd1f0635f452245f8efd21e7f`. This exactly matches `red-input.sha256` and the target RED's reported source identity.

The exact SHA match supports the reconstructed bytes, but it does not turn this post-run copy into a contemporaneous archive. The original `target-red.stdout.txt`, `target-red.stderr.txt`, exit code, old official receipt and output remain unchanged.
