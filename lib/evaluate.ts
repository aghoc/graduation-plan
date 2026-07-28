import {
  customCoursesFor, generalCourses, overlapIds, primaryCourses, secondaryCourses,
  type Course, type CourseStatus, type Profile,
} from "./catalog.ts";

export type Horizon = "current" | "projected";
export type RequirementState = "충족" | "충족예정" | "부족" | "확인 필요";
export type RequirementResult = {
  id: string;
  label: string;
  current: number | string;
  projected: number | string;
  target: string;
  shortage: string;
  state: RequirementState;
  currentDisplay?: string;
  projectedDisplay?: string;
};

export type CalculationLine = {
  code?: string;
  label: string;
  credits?: number;
  status: string;
  current: boolean;
  projected: boolean;
  note?: string;
};

export type CalculationDetail = {
  description: string;
  lines: CalculationLine[];
};

const active = (status: CourseStatus, horizon: Horizon) =>
  horizon === "current" ? status === "이수" : status === "이수" || status === "수강중" || status === "예정";
const statusOf = (profile: Profile, course: Course) => profile.statuses[course.id] ?? "미이수";
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const credits = (courses: Course[], profile: Profile, horizon: Horizon) =>
  sum(courses.filter((course) => active(statusOf(profile, course), horizon)).map((course) => course.credits));
const count = (courses: Course[], profile: Profile, horizon: Horizon) =>
  courses.filter((course) => active(statusOf(profile, course), horizon)).length;

type AutomaticOverlap = {
  primaryIds: Set<string>;
  primaryCredits: number;
  secondaryOnlyIds: Set<string>;
  secondaryOnlyCredits: number;
};

function state(currentOk: boolean, projectedOk: boolean, needsReview = false): RequirementState {
  if (needsReview) return "확인 필요";
  if (currentOk) return "충족";
  if (projectedOk) return "충족예정";
  return "부족";
}

function result(
  id: string,
  label: string,
  current: number | string,
  projected: number | string,
  target: string,
  currentOk: boolean,
  projectedOk: boolean,
  shortage: string,
  needsReview = false,
): RequirementResult {
  return { id, label, current, projected, target, shortage: projectedOk ? "-" : shortage, state: state(currentOk, projectedOk, needsReview) };
}

function automaticOverlap(profile: Profile, horizon: Horizon): AutomaticOverlap {
  let primaryCredits = 0;
  let secondaryOnlyCredits = 0;
  const primaryIds = new Set<string>();
  const secondaryOnlyIds = new Set<string>();

  // The first-major curriculum order gives the automatic, stable 9-credit allocation.
  overlapIds.forEach((id) => {
    const course = primaryCourses.find((item) => item.id === id)!;
    if (!active(statusOf(profile, course), horizon)) return;
    if (primaryCredits + course.credits <= 9) {
      primaryIds.add(id);
      primaryCredits += course.credits;
    } else {
      secondaryOnlyIds.add(id);
      secondaryOnlyCredits += course.credits;
    }
  });
  return { primaryIds, primaryCredits, secondaryOnlyIds, secondaryOnlyCredits };
}

function primaryEligible(course: Course, overlap: AutomaticOverlap) {
  return !overlapIds.includes(course.id) || overlap.primaryIds.has(course.id);
}

function medicalCourses(profile: Profile, horizon: Horizon, filter?: (course: Course) => boolean) {
  return secondaryCourses.filter((course) =>
    (!filter || filter(course)) &&
    active(statusOf(profile, course), horizon)
  );
}

function uniqueGraduationCourses(profile: Profile, horizon: Horizon) {
  const all = [...primaryCourses, ...generalCourses, ...secondaryCourses, ...customCoursesFor(profile)];
  const seen = new Set<string>();
  return all.filter((course) => {
    const key = course.code.trim().toUpperCase() || course.id;
    if (seen.has(key) || !active(statusOf(profile, course), horizon)) return false;
    seen.add(key);
    return true;
  });
}

export function evaluate(profile: Profile) {
  const overlaps = {
    current: automaticOverlap(profile, "current"),
    projected: automaticOverlap(profile, "projected"),
  };
  const primary = (horizon: Horizon, type?: "전필" | "전선") =>
    primaryCourses.filter((course) =>
      (!type || course.primaryType === type) &&
      primaryEligible(course, overlaps[horizon]) &&
      active(statusOf(profile, course), horizon)
    );
  const general = (horizon: Horizon, category: string, subcategory?: string) =>
    generalCourses.filter((course) =>
      course.category === category &&
      (!subcategory || course.subcategory === subcategory) &&
      active(statusOf(profile, course), horizon)
    );
  const med = (horizon: Horizon, filter?: (course: Course) => boolean) => medicalCourses(profile, horizon, filter);
  const medCredits = (horizon: Horizon, filter?: (course: Course) => boolean) => credits(med(horizon, filter), profile, horizon);
  const medCount = (horizon: Horizon, filter?: (course: Course) => boolean) => count(med(horizon, filter), profile, horizon);

  const total = (horizon: Horizon) =>
    credits(uniqueGraduationCourses(profile, horizon), profile, horizon) +
    (horizon === "current" ? profile.extraCredits.current : profile.extraCredits.current + profile.extraCredits.planned);
  const level3000 = (horizon: Horizon) =>
    credits(uniqueGraduationCourses(profile, horizon).filter((course) => course.level >= 3000), profile, horizon) +
    (horizon === "current" ? profile.extraCredits.current3000 : profile.extraCredits.current3000 + profile.extraCredits.planned3000);

  const requiredCodes = ["MBE1003", "MBE2003", "MBE2004", "MBE2010"];
  const requiredDone = (horizon: Horizon) => requiredCodes.every((id) =>
    primaryEligible(primaryCourses.find((course) => course.id === id)!, overlaps[horizon]) &&
    active(profile.statuses[id] ?? "미이수", horizon)
  );
  const duplicateCurrent = overlaps.current.primaryCredits;
  const duplicateProjected = overlaps.projected.primaryCredits;
  const commonFilter = (course: Course) => course.category === "공통교과목";
  const trackFilter = (course: Course) => course.subcategory === profile.selectedTrack;

  const secondRequirements = [
    result("medical-total", "2전공 총 이수학점", medCredits("current"), medCredits("projected"), "36학점", medCredits("current") >= 36, medCredits("projected") >= 36, `${Math.max(0, 36 - medCredits("projected"))}학점 부족`),
    result("medical-count", "2전공 총 이수과목", medCount("current"), medCount("projected"), "12과목", medCount("current") >= 12, medCount("projected") >= 12, `${Math.max(0, 12 - medCount("projected"))}과목 부족`),
    result("medical-required", "2전공 전공필수", medCredits("current", (course) => course.id === "MAI2002"), medCredits("projected", (course) => course.id === "MAI2002"), "3학점", medCredits("current", (course) => course.id === "MAI2002") >= 3, medCredits("projected", (course) => course.id === "MAI2002") >= 3, "3학점 부족"),
    result("medical-common", "공통교과목", medCredits("current", commonFilter), medCredits("projected", commonFilter), "3과목·9학점", medCount("current", commonFilter) >= 3 && medCredits("current", commonFilter) >= 9, medCount("projected", commonFilter) >= 3 && medCredits("projected", commonFilter) >= 9, `${Math.max(0, 3 - medCount("projected", commonFilter))}과목 / ${Math.max(0, 9 - medCredits("projected", commonFilter))}학점 부족`),
    result("medical-track", "선택 Track 심화", medCredits("current", trackFilter), medCredits("projected", trackFilter), "5과목·15학점", medCount("current", trackFilter) >= 5 && medCredits("current", trackFilter) >= 15, medCount("projected", trackFilter) >= 5 && medCredits("projected", trackFilter) >= 15, `${Math.max(0, 5 - medCount("projected", trackFilter))}과목 / ${Math.max(0, 15 - medCredits("projected", trackFilter))}학점 부족`),
    result("duplicates", "의공학 중복인정 자동반영", duplicateCurrent, duplicateProjected, "최대 9학점 · 초과분 2전공", true, true, "-"),
  ];
  const secondCurrentOk = secondRequirements.every((item) => item.state === "충족");
  const secondProjectedOk = secondRequirements.every((item) => item.state === "충족" || item.state === "충족예정");

  const generalBaseCurrent = credits(general("current", "교양기초", "필수"), profile, "current");
  const generalBaseProjected = credits(general("projected", "교양기초", "필수"), profile, "projected");
  const universityRequiredCurrent = credits(general("current", "대학교양", "필수"), profile, "current");
  const universityRequiredProjected = credits(general("projected", "대학교양", "필수"), profile, "projected");
  const universityElectiveCurrent = general("current", "대학교양", "선택");
  const universityElectiveProjected = general("projected", "대학교양", "선택");
  const explorationRequiredCurrent = credits(general("current", "전공탐색", "필수"), profile, "current");
  const explorationRequiredProjected = credits(general("projected", "전공탐색", "필수"), profile, "projected");
  const explorationElectiveCurrent = general("current", "전공탐색", "선택");
  const explorationElectiveProjected = general("projected", "전공탐색", "선택");
  const primaryRequiredCurrent = credits(primary("current", "전필"), profile, "current");
  const primaryRequiredProjected = credits(primary("projected", "전필"), profile, "projected");
  const primaryElectiveCurrent = credits(primary("current", "전선"), profile, "current");
  const primaryElectiveProjected = credits(primary("projected", "전선"), profile, "projected");
  const primaryTotalCurrent = credits(primary("current"), profile, "current");
  const primaryTotalProjected = credits(primary("projected"), profile, "projected");

  const requirements: RequirementResult[] = [
    result("total", "총 졸업학점", total("current"), total("projected"), "135학점", total("current") >= 135, total("projected") >= 135, `${Math.max(0, 135 - total("projected"))}학점 부족`),
    result("general-base", "교양기초", generalBaseCurrent, generalBaseProjected, "22학점", generalBaseCurrent >= 22, generalBaseProjected >= 22, `${Math.max(0, 22 - generalBaseProjected)}학점 부족`),
    result("university-required", "대학교양 필수", universityRequiredCurrent, universityRequiredProjected, "3학점", universityRequiredCurrent >= 3, universityRequiredProjected >= 3, `${Math.max(0, 3 - universityRequiredProjected)}학점 부족`),
    result("university-elective", "대학교양 선택영역", universityElectiveCurrent.length, universityElectiveProjected.length, "4개 영역·12학점", universityElectiveCurrent.length >= 4 && credits(universityElectiveCurrent, profile, "current") >= 12, universityElectiveProjected.length >= 4 && credits(universityElectiveProjected, profile, "projected") >= 12, `${Math.max(0, 4 - universityElectiveProjected.length)}영역 / ${Math.max(0, 12 - credits(universityElectiveProjected, profile, "projected"))}학점 부족`),
    result("exploration-required", "전공탐색 필수", explorationRequiredCurrent, explorationRequiredProjected, "18학점", explorationRequiredCurrent >= 18, explorationRequiredProjected >= 18, `${Math.max(0, 18 - explorationRequiredProjected)}학점 부족`),
    result("exploration-elective", "전공탐색 선택", explorationElectiveCurrent.length, explorationElectiveProjected.length, "2과목·6학점", explorationElectiveCurrent.length >= 2 && credits(explorationElectiveCurrent, profile, "current") >= 6, explorationElectiveProjected.length >= 2 && credits(explorationElectiveProjected, profile, "projected") >= 6, `${Math.max(0, 2 - explorationElectiveProjected.length)}과목 / ${Math.max(0, 6 - credits(explorationElectiveProjected, profile, "projected"))}학점 부족`),
    result("primary-required", "의공학 전공필수", primaryRequiredCurrent, primaryRequiredProjected, "12학점·지정 4과목", primaryRequiredCurrent >= 12 && requiredDone("current"), primaryRequiredProjected >= 12 && requiredDone("projected"), "지정과목 확인"),
    result("primary-elective", "의공학 전공선택", primaryElectiveCurrent, primaryElectiveProjected, "24학점", primaryElectiveCurrent >= 24, primaryElectiveProjected >= 24, `${Math.max(0, 24 - primaryElectiveProjected)}학점 부족`),
    result("primary-total", "의공학 전공 총학점", primaryTotalCurrent, primaryTotalProjected, "36학점", primaryTotalCurrent >= 36, primaryTotalProjected >= 36, `${Math.max(0, 36 - primaryTotalProjected)}학점 부족`),
    result("level3000", "3000단위 이상", level3000("current"), level3000("projected"), "45학점", level3000("current") >= 45, level3000("projected") >= 45, `${Math.max(0, 45 - level3000("projected"))}학점 부족`),
    result("second-major", "2개 이상 전공", secondCurrentOk ? 1 : 0, secondProjectedOk ? 1 : 0, "2전공 이수요건 충족", secondCurrentOk, secondProjectedOk, "2전공 요건 확인"),
    result("language", "외국어인증", profile.certifications.language ? "이수" : "미이수", profile.certifications.language ? "이수" : "미이수", "필수", profile.certifications.language, profile.certifications.language, "인증 필요"),
    result("practical", "정보/산업실무 인증", profile.certifications.practical ? "이수" : "미이수", profile.certifications.practical ? "이수" : "미이수", "택1", profile.certifications.practical, profile.certifications.practical, "인증 필요"),
  ];
  const overallCurrent = requirements.every((item) => item.state === "충족");
  const overallProjected = requirements.every((item) => item.state === "충족" || item.state === "충족예정");
  const overallState = state(overallCurrent, overallProjected);
  const linesFor = (
    projectedCourses: Course[],
    currentCourses: Course[],
    noteFor?: (course: Course) => string | undefined,
  ): CalculationLine[] => {
    const currentIds = new Set(currentCourses.map((course) => course.id));
    return projectedCourses.map((course) => ({
      code: course.code,
      label: course.name,
      credits: course.credits,
      status: statusOf(profile, course),
      current: currentIds.has(course.id),
      projected: true,
      note: noteFor?.(course),
    }));
  };
  const totalCurrentCourses = uniqueGraduationCourses(profile, "current");
  const totalProjectedCourses = uniqueGraduationCourses(profile, "projected");
  const levelCurrentCourses = totalCurrentCourses.filter((course) => course.level >= 3000);
  const levelProjectedCourses = totalProjectedCourses.filter((course) => course.level >= 3000);
  const primaryCurrentCourses = primary("current");
  const primaryProjectedCourses = primary("projected");
  const detailFor = (projectedCourses: Course[], currentCourses: Course[], description: string, noteFor?: (course: Course) => string | undefined) => ({
    description,
    lines: linesFor(projectedCourses, currentCourses, noteFor),
  });
  const currentSecondStates = new Set(secondRequirements.filter((item) => item.state === "충족").map((item) => item.id));
  const projectedSecondStates = new Set(secondRequirements.filter((item) => item.state === "충족" || item.state === "충족예정").map((item) => item.id));
  const calculationDetails: Record<string, CalculationDetail> = {
    total: {
      description: "동일 학정번호 과목은 총 졸업학점에 한 번만 반영됩니다.",
      lines: [
        ...linesFor(totalProjectedCourses, totalCurrentCourses),
        ...(profile.extraCredits.current || profile.extraCredits.planned ? [{
          label: "기타 학점", credits: profile.extraCredits.current + profile.extraCredits.planned, status: "직접 입력",
          current: profile.extraCredits.current > 0, projected: profile.extraCredits.current + profile.extraCredits.planned > 0,
          note: `현재 ${profile.extraCredits.current}학점 / 예정 ${profile.extraCredits.planned}학점`,
        }] : []),
      ],
    },
    "general-base": detailFor(general("projected", "교양기초", "필수"), general("current", "교양기초", "필수"), "교양기초 필수 과목만 반영합니다."),
    "university-required": detailFor(general("projected", "대학교양", "필수"), general("current", "대학교양", "필수"), "대학교양 필수 과목만 반영합니다."),
    "university-elective": detailFor(universityElectiveProjected, universityElectiveCurrent, "서로 다른 영역의 대학교양 선택 과목을 계산합니다."),
    "exploration-required": detailFor(general("projected", "전공탐색", "필수"), general("current", "전공탐색", "필수"), "전공탐색 필수 과목만 반영합니다."),
    "exploration-elective": detailFor(explorationElectiveProjected, explorationElectiveCurrent, "전공탐색 선택 과목을 계산합니다."),
    "primary-required": detailFor(primary("projected", "전필"), primary("current", "전필"), "지정된 전공필수 4과목과 전공필수 학점을 함께 확인합니다.", (course) => requiredCodes.includes(course.id) ? "지정 필수과목" : undefined),
    "primary-elective": detailFor(primary("projected", "전선"), primary("current", "전선"), "의공학전공 전공선택으로 반영되는 과목입니다."),
    "primary-total": detailFor(primaryProjectedCourses, primaryCurrentCourses, "의공학전공으로 반영되는 전공필수·전공선택 과목입니다. 중복인정은 최대 9학점까지 자동 반영됩니다."),
    level3000: {
      description: "총 졸업학점에 반영되는 과목 중 3000단위 이상만 계산합니다.",
      lines: [
        ...linesFor(levelProjectedCourses, levelCurrentCourses),
        ...(profile.extraCredits.current3000 || profile.extraCredits.planned3000 ? [{
          label: "기타 3000단위 학점", credits: profile.extraCredits.current3000 + profile.extraCredits.planned3000, status: "직접 입력",
          current: profile.extraCredits.current3000 > 0, projected: profile.extraCredits.current3000 + profile.extraCredits.planned3000 > 0,
          note: `현재 ${profile.extraCredits.current3000}학점 / 예정 ${profile.extraCredits.planned3000}학점`,
        }] : []),
      ],
    },
    "second-major": {
      description: "의료AI반도체융합전공의 모든 세부 요건을 함께 확인합니다.",
      lines: secondRequirements.map((item) => ({
        label: item.label, status: item.state, current: currentSecondStates.has(item.id), projected: projectedSecondStates.has(item.id), note: `${item.current} / ${item.projected} · 기준 ${item.target}`,
      })),
    },
    language: { description: "외국어인증 등록 여부를 반영합니다.", lines: [{ label: "외국어인증", status: profile.certifications.language ? "이수" : "미이수", current: profile.certifications.language, projected: profile.certifications.language }] },
    practical: { description: "정보인증 또는 산업실무역량인증 등록 여부를 반영합니다.", lines: [{ label: "정보/산업실무 인증", status: profile.certifications.practical ? "이수" : "미이수", current: profile.certifications.practical, projected: profile.certifications.practical }] },
    "medical-total": detailFor(med("projected"), med("current"), "의료AI반도체융합전공 과목 전체를 계산합니다."),
    "medical-count": detailFor(med("projected"), med("current"), "의료AI반도체융합전공 과목 수를 계산합니다."),
    "medical-required": detailFor(med("projected", (course) => course.id === "MAI2002"), med("current", (course) => course.id === "MAI2002"), "전공필수 인공지능 과목을 계산합니다."),
    "medical-common": detailFor(med("projected", commonFilter), med("current", commonFilter), "공통교과목 3과목·9학점을 계산합니다."),
    "medical-track": detailFor(med("projected", trackFilter), med("current", trackFilter), `${profile.selectedTrack} 심화 과목만 계산합니다.`),
    duplicates: detailFor(
      overlapIds.map((id) => primaryCourses.find((course) => course.id === id)!).filter((course) => active(statusOf(profile, course), "projected")),
      overlapIds.map((id) => primaryCourses.find((course) => course.id === id)!).filter((course) => active(statusOf(profile, course), "current")),
      "의공학전공 과목 순서로 최대 9학점까지 의공학전공과 2전공에 함께 반영합니다.",
      (course) => overlaps.projected.primaryIds.has(course.id) ? "의공학전공 + 2전공 반영" : "2전공만 반영 (중복 9학점 초과)",
    ),
  };
  const creditDisplay = (value: number | string) => `${value}학점`;
  const courseCreditDisplay = (courses: Course[], value: number | string, profileHorizon: Horizon) =>
    `${count(courses, profile, profileHorizon)}과목 · ${value}학점`;
  const requiredCourseCount = (horizon: Horizon) => requiredCodes.filter((id) =>
    primaryEligible(primaryCourses.find((course) => course.id === id)!, overlaps[horizon]) &&
    active(profile.statuses[id] ?? "미이수", horizon)
  ).length;
  const withDisplays = (item: RequirementResult): RequirementResult => {
    const horizon = item.id;
    if (["total", "general-base", "university-required", "exploration-required", "primary-elective", "primary-total", "level3000", "medical-total", "medical-required", "duplicates"].includes(horizon)) {
      return { ...item, currentDisplay: creditDisplay(item.current), projectedDisplay: creditDisplay(item.projected) };
    }
    if (horizon === "university-elective") {
      return {
        ...item,
        currentDisplay: `${universityElectiveCurrent.length}영역 · ${credits(universityElectiveCurrent, profile, "current")}학점`,
        projectedDisplay: `${universityElectiveProjected.length}영역 · ${credits(universityElectiveProjected, profile, "projected")}학점`,
      };
    }
    if (horizon === "exploration-elective") {
      return {
        ...item,
        currentDisplay: courseCreditDisplay(explorationElectiveCurrent, credits(explorationElectiveCurrent, profile, "current"), "current"),
        projectedDisplay: courseCreditDisplay(explorationElectiveProjected, credits(explorationElectiveProjected, profile, "projected"), "projected"),
      };
    }
    if (horizon === "primary-required") {
      return {
        ...item,
        currentDisplay: `${requiredCourseCount("current")}/4 지정과목 · ${item.current}학점`,
        projectedDisplay: `${requiredCourseCount("projected")}/4 지정과목 · ${item.projected}학점`,
      };
    }
    if (horizon === "second-major") {
      return { ...item, currentDisplay: item.current ? "충족" : "미충족", projectedDisplay: item.projected ? "충족" : "미충족" };
    }
    if (horizon === "medical-count") {
      return { ...item, currentDisplay: `${item.current}과목`, projectedDisplay: `${item.projected}과목` };
    }
    if (horizon === "medical-common") {
      return {
        ...item,
        currentDisplay: courseCreditDisplay(med("current", commonFilter), item.current, "current"),
        projectedDisplay: courseCreditDisplay(med("projected", commonFilter), item.projected, "projected"),
      };
    }
    if (horizon === "medical-track") {
      return {
        ...item,
        currentDisplay: courseCreditDisplay(med("current", trackFilter), item.current, "current"),
        projectedDisplay: courseCreditDisplay(med("projected", trackFilter), item.projected, "projected"),
      };
    }
    return item;
  };
  const displayedRequirements = requirements.map(withDisplays);
  const displayedSecondRequirements = secondRequirements.map(withDisplays);

  return {
    requirements: displayedRequirements,
    secondRequirements: displayedSecondRequirements,
    overallState,
    totalCurrent: total("current"),
    totalProjected: total("projected"),
    level3000Current: level3000("current"),
    level3000Projected: level3000("projected"),
    duplicateCurrent,
    duplicateProjected,
    duplicateOverflowCurrent: overlaps.current.secondaryOnlyCredits,
    duplicateOverflowProjected: overlaps.projected.secondaryOnlyCredits,
    secondCurrentCredits: medCredits("current"),
    secondProjectedCredits: medCredits("projected"),
    secondCurrentCount: medCount("current"),
    secondProjectedCount: medCount("projected"),
    calculationDetails,
  };
}
