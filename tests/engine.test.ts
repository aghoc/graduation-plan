import test from "node:test";
import assert from "node:assert/strict";
import { createProfile, customCourseStatusId, normalizeProfileBackup, normalizeStoredProfile } from "../lib/catalog.ts";
import { evaluate } from "../lib/evaluate.ts";

const detailCredits = (
  report: ReturnType<typeof evaluate>,
  id: string,
  horizon: "current" | "projected",
  predicate: (line: ReturnType<typeof evaluate>["calculationDetails"][string]["lines"][number]) => boolean = () => true,
) => report.calculationDetails[id].lines
  .filter((line) => line[horizon] && predicate(line))
  .reduce((total, line) => total + (line.credits ?? 0), 0);

test("sample profile matches the verified workbook totals", () => {
  const report = evaluate(createProfile("검증", true));
  assert.equal(report.totalCurrent, 86);
  assert.equal(report.totalProjected, 123);
  assert.equal(report.level3000Current, 9);
  assert.equal(report.level3000Projected, 35);
  assert.equal(report.secondCurrentCredits, 9);
  assert.equal(report.secondProjectedCredits, 36);
  assert.equal(report.secondCurrentCount, 3);
  assert.equal(report.secondProjectedCount, 12);
  assert.equal(report.duplicateProjected, 9);
  assert.equal(report.duplicateOverflowProjected, 3);
});

test("overlaps beyond nine credits become second-major only automatically", () => {
  const profile = createProfile("검증", false);
  ["MBE2004", "MBE2015", "MEE3014", "MBE3028"].forEach((id) => { profile.statuses[id] = "이수"; });
  const report = evaluate(profile);
  const primary = report.requirements.find((item) => item.id === "primary-total");
  assert.equal(primary?.current, 9);
  assert.equal(report.duplicateCurrent, 9);
  assert.equal(report.duplicateOverflowCurrent, 3);
  assert.equal(report.secondCurrentCredits, 12);
  assert.equal(report.totalCurrent, 12);
});

test("calculation details reconcile with every displayed credit total", () => {
  const report = evaluate(createProfile("검증", true));
  const requirement = (id: string) => report.requirements.find((item) => item.id === id)!;

  assert.equal(detailCredits(report, "total", "current"), report.totalCurrent);
  assert.equal(detailCredits(report, "total", "projected"), report.totalProjected);
  assert.equal(detailCredits(report, "level3000", "current"), report.level3000Current);
  assert.equal(detailCredits(report, "level3000", "projected"), report.level3000Projected);
  assert.equal(detailCredits(report, "primary-total", "current"), requirement("primary-total").current);
  assert.equal(detailCredits(report, "primary-total", "projected"), requirement("primary-total").projected);
  assert.equal(detailCredits(report, "medical-total", "current"), report.secondCurrentCredits);
  assert.equal(detailCredits(report, "medical-total", "projected"), report.secondProjectedCredits);
  assert.equal(
    detailCredits(report, "duplicates", "projected", (line) => line.note === "의공학전공 + 2전공 반영"),
    report.duplicateProjected,
  );
});

test("custom courses count toward total and 3000-level credits only", () => {
  const profile = createProfile("추가 과목", false);
  const course = { id: "custom-course", code: "ABC3001", name: "타학과 심화과목", credits: 3 };
  profile.customCourses = [course];
  profile.statuses[customCourseStatusId(course.id)] = "예정";
  const report = evaluate(profile);

  assert.equal(report.totalCurrent, 0);
  assert.equal(report.totalProjected, 3);
  assert.equal(report.level3000Current, 0);
  assert.equal(report.level3000Projected, 3);
  assert.equal(report.secondProjectedCredits, 0);
  assert.equal(report.requirements.find((item) => item.id === "primary-total")?.projected, 0);
  assert.equal(report.calculationDetails.total.lines.at(-1)?.label, "타학과 심화과목");
});

test("a custom course with a catalog code is not double counted", () => {
  const profile = createProfile("중복 방지", false);
  const course = { id: "same-code", code: "MBE2003", name: "인체생리학", credits: 3 };
  profile.customCourses = [course];
  profile.statuses.MBE2003 = "이수";
  profile.statuses[customCourseStatusId(course.id)] = "이수";
  assert.equal(evaluate(profile).totalCurrent, 3);
});

test("blank profiles start with zero credits", () => {
  const report = evaluate(createProfile("새 계획", false));
  assert.equal(report.totalCurrent, 0);
  assert.equal(report.totalProjected, 0);
  assert.equal(report.secondProjectedCredits, 0);
});

test("backup import fills in omitted optional fields safely", () => {
  const profile = normalizeProfileBackup({
    name: "이전 백업",
    statuses: { MBE2003: "이수", unknown: "예정" },
  });
  assert.equal(profile.statuses.MBE2003, "이수");
  assert.equal("unknown" in profile.statuses, false);
  assert.deepEqual(profile.extraCredits, { current: 0, planned: 0, current3000: 0, planned3000: 0 });
  assert.deepEqual(profile.certifications, { language: false, practical: false });
  assert.doesNotThrow(() => evaluate(profile));
});

test("legacy recognition choices are removed from saved profiles", () => {
  const profile = normalizeStoredProfile({
    id: "legacy-profile",
    updatedAt: "2026-07-24T00:00:00.000Z",
    name: "이전 계획",
    statuses: { MBE2004: "이수" },
    recognitions: { MBE2004: "2전공만" },
  });
  assert.equal(profile.id, "legacy-profile");
  assert.equal("recognitions" in profile, false);
  assert.equal(evaluate(profile).duplicateCurrent, 3);
});

test("backup import rejects unusable profiles", () => {
  assert.throws(() => normalizeProfileBackup({ name: "불완전 백업" }));
  assert.throws(() => normalizeProfileBackup({ statuses: {} }));
});
