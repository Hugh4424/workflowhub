import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFileSync(resolve(root, path), "utf8");

describe("facts subschema completion ownership", () => {
  it("keeps phase_completion as a compatible output but assigns it to runtime task certification", () => {
    const contract = JSON.parse(read("contracts/facts-subschema.json"));
    const buildCode = contract.stages["build-code"];

    expect(buildCode.required_keys).toContain("phase_completion");
    expect(buildCode.semantics.phase_completion).toMatch(
      /derived by the runtime[\s\S]*current tasks\.md[\s\S]*callers cannot assert completion/i,
    );
  });

  it("does not let the implementation receipt accept a caller completion claim", () => {
    const writer = read("core/canonical-receipt-writer.mjs");

    expect(writer).toMatch(/implementation payload must be empty/i);
    expect(writer).not.toMatch(/implementation payload accepts only phase_completion/i);
  });
});
