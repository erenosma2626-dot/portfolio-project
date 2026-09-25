import { describe, expect, it } from "vitest";
import { isKnownThirdPartyWarning } from "./console-filter";

describe("isKnownThirdPartyWarning", () => {
  it("R3F 9.8'in THREE.Clock uyarısını tanır", () => {
    expect(
      isKnownThirdPartyWarning("warn", "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead."),
    ).toBe(true);
  });
  it("diğer uyarı ve hataları geçirir", () => {
    expect(isKnownThirdPartyWarning("warn", "THREE.WebGLProgram: Shader Error")).toBe(false);
    expect(isKnownThirdPartyWarning("error", "THREE.Clock: This module has been deprecated.")).toBe(false);
  });
});
