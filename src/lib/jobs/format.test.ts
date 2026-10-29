import { describe, expect, it } from "vitest";
import { formatDate, formatMinYears } from "./format";

describe("formatMinYears", () => {
  it.each([
    [0, "No minimum"],
    [1, "1+ year"],
    [2.5, "2.5+ years"],
    [10, "10+ years"],
  ])("%s -> %s", (years, expected) => {
    expect(formatMinYears(years)).toBe(expected);
  });
});

describe("formatDate", () => {
  it("formats an ISO timestamp as a short US date", () => {
    expect(formatDate("2026-10-29T12:00:00Z")).toBe("Oct 29, 2026");
  });
});
