import { describe, expect, it } from "vitest";

import { isFacebookReferrer } from "@/lib/facebook-referrer";

describe("isFacebookReferrer", () => {
  it("detects Facebook referring hosts", () => {
    expect(isFacebookReferrer("https://l.facebook.com/l.php?u=x")).toBe(true);
    expect(isFacebookReferrer("https://lm.facebook.com/")).toBe(true);
    expect(isFacebookReferrer("https://www.facebook.com/")).toBe(true);
    expect(isFacebookReferrer("https://facebook.com/")).toBe(true);
    expect(isFacebookReferrer("https://web.facebook.com/")).toBe(true);
  });

  it("rejects lookalike and non-Facebook referrers", () => {
    expect(isFacebookReferrer("https://evilfacebook.com/")).toBe(false);
    expect(isFacebookReferrer("https://facebook.com.evil.example/")).toBe(false);
    expect(isFacebookReferrer("https://example.com/")).toBe(false);
    expect(isFacebookReferrer("")).toBe(false);
    expect(isFacebookReferrer("not a url")).toBe(false);
  });
});
