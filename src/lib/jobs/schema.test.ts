import { describe, expect, it } from "vitest";
import { firstFieldErrors } from "@/lib/forms";
import { jobFormSchema, parseSkillList, toJobColumns } from "./schema";

describe("parseSkillList", () => {
  it("splits on newlines and commas, trims and collapses whitespace", () => {
    expect(parseSkillList("React,  TypeScript\n\n Node   .js ")).toEqual(["React", "TypeScript", "Node .js"]);
  });

  it("drops case-insensitive duplicates, keeping the first spelling", () => {
    expect(parseSkillList("PostgreSQL\npostgresql\nPOSTGRESQL")).toEqual(["PostgreSQL"]);
  });

  it("returns an empty list for non-strings", () => {
    expect(parseSkillList(undefined)).toEqual([]);
    expect(parseSkillList(42)).toEqual([]);
  });
});

const valid = {
  title: "  Senior Java Developer ",
  description: "Build services.",
  mustHaveSkills: "Java\nSpring Boot",
  niceToHaveSkills: "Kafka",
  minYearsExperience: "5",
  location: " Dallas, TX ",
  workMode: "hybrid",
};

function errorsFor(input: Record<string, unknown>) {
  const result = jobFormSchema.safeParse(input);
  if (result.success) throw new Error("expected validation to fail");
  return firstFieldErrors(result.error);
}

describe("jobFormSchema", () => {
  it("parses a valid form and defaults status to open", () => {
    const job = jobFormSchema.parse(valid);
    expect(job).toMatchObject({
      title: "Senior Java Developer",
      mustHaveSkills: ["Java", "Spring Boot"],
      niceToHaveSkills: ["Kafka"],
      minYearsExperience: 5,
      location: "Dallas, TX",
      workMode: "hybrid",
      status: "open",
    });
  });

  it("treats blank years as no minimum and blank location as null", () => {
    const job = jobFormSchema.parse({ ...valid, minYearsExperience: "", location: "  " });
    expect(job.minYearsExperience).toBe(0);
    expect(job.location).toBeNull();
  });

  it("rounds years to one decimal, matching numeric(4,1)", () => {
    expect(jobFormSchema.parse({ ...valid, minYearsExperience: "2.25" }).minYearsExperience).toBe(2.3);
  });

  it("requires at least one must-have skill", () => {
    expect(errorsFor({ ...valid, mustHaveSkills: " , \n" }).mustHaveSkills).toBe("Add at least one must-have skill.");
  });

  it("rejects a skill listed as both must-have and nice-to-have", () => {
    expect(errorsFor({ ...valid, niceToHaveSkills: "java" }).niceToHaveSkills).toBe('"java" is already a must-have skill.');
  });

  it("caps the number and length of skills", () => {
    const many = Array.from({ length: 31 }, (_, i) => `Skill ${i}`).join("\n");
    expect(errorsFor({ ...valid, mustHaveSkills: many }).mustHaveSkills).toBe("Add at most 30 must-have skills.");
    expect(errorsFor({ ...valid, mustHaveSkills: "x".repeat(61) }).mustHaveSkills).toBe(
      "Keep each skill under 60 characters.",
    );
  });

  it.each([
    ["negative years", { minYearsExperience: "-1" }, "minYearsExperience", "Years can't be negative."],
    ["non-numeric years", { minYearsExperience: "five" }, "minYearsExperience", "Enter a number of years."],
    ["unknown work mode", { workMode: "moon" }, "workMode", "Choose a work mode."],
    ["blank title", { title: "  " }, "title", "Enter a job title."],
    ["blank description", { description: "" }, "description", "Paste the job description."],
  ])("rejects %s", (_label, override, field, message) => {
    expect(errorsFor({ ...valid, ...override })[field]).toBe(message);
  });

  it("ignores organization_id or created_by smuggled into the form", () => {
    const job = jobFormSchema.parse({ ...valid, organization_id: "other-org", created_by: "someone" });
    expect(toJobColumns(job)).not.toHaveProperty("organization_id");
    expect(toJobColumns(job)).not.toHaveProperty("created_by");
  });
});
