// Enforces the security rules in AGENTS.md by scanning source files.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

const files = sourceFiles(SRC).map((path) => ({
  path: relative(SRC, path).replaceAll("\\", "/"),
  code: readFileSync(path, "utf8"),
}));

const offenders = (predicate: (code: string) => boolean) =>
  files.filter((file) => predicate(file.code)).map((file) => file.path);

describe("security rules", () => {
  it("never queries Supabase inside a 'use cache' scope", () => {
    const useCacheDirective = /^\s*["']use cache(: \w+)?["'];?\s*$/m;
    expect(
      offenders((code) => useCacheDirective.test(code) && /@\/lib\/supabase|@\/lib\/auth\/current-recruiter/.test(code)),
    ).toEqual([]);
  });

  it("never trusts getSession() for identity", () => {
    expect(offenders((code) => /\.auth\.getSession\(/.test(code))).toEqual([]);
  });

  it("reads the secret key only in server-only modules", () => {
    expect(offenders((code) => code.includes("SUPABASE_SECRET_KEY") && !code.includes('import "server-only"'))).toEqual([]);
  });

  it("keeps server data access out of client components", () => {
    expect(
      offenders((code) => /^["']use client["']/.test(code) && /@\/lib\/supabase\/server|@\/lib\/auth\/current-recruiter/.test(code)),
    ).toEqual([]);
  });

  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(10);
  });
});
