import { describe, expect, it } from "vitest";
import { getStartupStatus } from "../shared/startupState";

describe("homepage startup state", () => {
  it("keeps the startup screen while auth or bootstrap is loading", () => {
    expect(getStartupStatus({ authLoading: true, bootstrapLoading: false, bootstrapError: false, timedOut: false })).toBe("loading");
    expect(getStartupStatus({ authLoading: false, bootstrapLoading: true, bootstrapError: false, timedOut: false })).toBe("loading");
  });

  it("exposes a recoverable state for API errors and timeouts", () => {
    expect(getStartupStatus({ authLoading: false, bootstrapLoading: false, bootstrapError: true, timedOut: false })).toBe("recoverable-error");
    expect(getStartupStatus({ authLoading: true, bootstrapLoading: true, bootstrapError: false, timedOut: true })).toBe("recoverable-error");
  });

  it("is ready once startup requests finish successfully", () => {
    expect(getStartupStatus({ authLoading: false, bootstrapLoading: false, bootstrapError: false, timedOut: false })).toBe("ready");
  });
});
