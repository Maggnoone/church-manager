import { describe, expect, it } from "vitest";
import { getSafeErrorDetails } from "@/lib/safe-error";

describe("safe error details", () => {
  it("redacts authentication secrets while preserving useful context", () => {
    const details = getSafeErrorDetails(
      new Error(
        "Request failed?access_token=access-value: Bearer bearer-value eyJheader.payload.signature",
      ),
    );

    expect(details.message).toContain("Request failed");
    expect(details.message).not.toContain("access-value");
    expect(details.message).not.toContain("bearer-value");
    expect(details.message).not.toContain("eyJheader.payload.signature");
  });

  it("redacts the complete bearer token regardless of casing and spacing", () => {
    const details = getSafeErrorDetails(
      new Error("Authorization: bEaReR    opaque-bearer-token-value request failed"),
    );

    expect(details.message).toContain("Authorization");
    expect(details.message).not.toContain("opaque-bearer-token-value");
  });

  it("redacts sensitive assignment values while preserving the error context", () => {
    const details = getSafeErrorDetails(
      new Error(
        "Role lookup failed: code=private-code private_key: private-key-value private-key = \"private key value\" session: session-value",
      ),
    );

    expect(details.message).toContain("Role lookup failed");
    expect(details.message).not.toContain("private-code");
    expect(details.message).not.toContain("private-key-value");
    expect(details.message).not.toContain("private key value");
    expect(details.message).not.toContain("session-value");
  });

  it("serializes non-Error objects with bounded circular-safe details", () => {
    const error: Record<string, unknown> = {
      detail: "Role lookup failed",
      authorization: "Bearer opaque-object-token",
      code: "object-secret-code",
      payload: Array.from({ length: 100 }, (_, index) => index),
    };
    error.self = error;

    const details = getSafeErrorDetails(error);

    expect(details.message).toContain('"detail":"Role lookup failed"');
    expect(details.message).toContain("[Circular]");
    expect(details.message).toContain("[Truncated]");
    expect(details.message).not.toContain("[object Object]");
    expect(details.message).not.toContain("opaque-object-token");
    expect(details.message).not.toContain("object-secret-code");
    expect(details.message.length).toBeLessThan(4_100);
  });
});
