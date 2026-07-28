export type CourseStatus = "미이수" | "이수" | "수강중" | "예정";
export type Track =
  | "의료 AI 솔루션개발 Track"
  | "의료 데이터 분석 Track"
  | "의료 AI 반도체설계 Track";

export type Course = {
  id: string;
  code: string;
  name: string;
  credits: number;
  level: number;
  semester?: string;
  category: string;
  subcategory?: string;
  department?: string;
  primaryType?: "전필" | "전선";
  source: "primary" | "general" | "secondary" | "custom";
};

export type CustomCourse = {
  id: string;
  code: string;
  name: string;
  credits: number;
};

export type Profile = {
  id: string;
  name: string;
  selectedTrack: Track;
  statuses: Record<string, CourseStatus>;
  customCourses: CustomCourse[];
  extraCredits: { current: number; planned: number; current3000: number; planned3000: number };
  certifications: { language: boolean; practical: boolean };
  updatedAt: string;
};

const primaryRows = [
  ["MBE2003", "인체생리학", 3, 2000, "1", "전필"],
  ["MBE2004", "회로이론및실습", 3, 2000, "1", "전필"],
  ["MBE2015", "디지털시스템및실험", 3, 2000, "1", "전선"],
  ["MBE2022", "기초실험(1)", 3, 2000, "1", "전선"],
  ["MBE2020", "바이오공학", 3, 2000, "1", "전선"],
  ["MBE3037", "생체역학", 3, 3000, "1", "전선"],
  ["MBE3055", "생체유기화학", 3, 3000, "1", "전선"],
  ["MBE1003", "인체해부학", 3, 1000, "2", "전필"],
  ["MBE2010", "생체신호및시스템", 3, 2000, "2", "전필"],
  ["MBE2012", "공학확률", 3, 2000, "2", "전선"],
  ["MBE3020", "고급컴퓨터프로그래밍", 3, 3000, "2", "전선"],
  ["MBE2018", "전자회로및실습", 3, 2000, "2", "전선"],
  ["MBE2023", "기초실험(2)", 3, 2000, "2", "전선"],
  ["MRE3004", "CAD", 3, 3000, "2", "전선"],
  ["MBE3060", "생체동역학", 3, 3000, "2", "전선"],
  ["MBE3019", "의료영상학1", 3, 3000, "1", "전선"],
  ["MBE3029", "디지탈신호처리", 3, 3000, "1", "전선"],
  ["MEE3014", "의료전자시스템및실험", 3, 3000, "1", "전선"],
  ["MBE3058", "의공데이터분석", 3, 3000, "1", "전선"],
  ["MBE3039", "생화학", 3, 3000, "1", "전선"],
  ["MBE3045", "바이오기계공학", 3, 3000, "1", "전선"],
  ["MRE4004", "유한요소해석", 3, 4000, "1", "전선"],
  ["MBE3028", "마이크로프로세서및실험", 3, 3000, "2", "전선"],
  ["MEE3008", "의광학이론및실험", 3, 3000, "2", "전선"],
  ["MEE3010", "의료영상신호처리", 3, 3000, "2", "전선"],
  ["MEE3011", "생체전기자기현상", 3, 3000, "2", "전선"],
  ["MBE3059", "의공학을위한기계학습", 3, 3000, "2", "전선"],
  ["MBE4009", "바이오센서공학", 3, 4000, "2", "전선"],
  ["MBE3047", "의공학논술", 3, 3000, "2", "전선"],
  ["MRE4005", "가상생체해석및실험", 3, 4000, "2", "전선"],
  ["MBE3051", "캡스톤디자인", 3, 3000, "1", "전선"],
  ["MBE3030", "의용계측", 3, 3000, "1", "전선"],
  ["MBE4010", "바이오멤스의응용", 3, 4000, "1", "전선"],
  ["MEE4004", "의광학응용", 3, 4000, "1", "전선"],
  ["MRE4007", "생체재료", 3, 4000, "1", "전선"],
  ["MRE4010", "뇌신경공학", 3, 4000, "2", "전선"],
  ["MEE4008", "고급Visual프로그래밍", 3, 4000, "2", "전선"],
  ["MRE4002", "의료영상학2", 3, 4000, "2", "전선"],
  ["MBE3041", "기업실무(1)P", 1, 3000, "1,2", "전선"],
  ["MBE3042", "기업실무(2)P", 1, 3000, "1,2", "전선"],
  ["MBE3043", "기업실무(3)P", 1, 3000, "1,2", "전선"],
  ["MBE3044", "기업실무(4)P", 1, 3000, "1,2", "전선"],
  ["MBE4013", "학부연구(1)P", 2, 4000, "1,2", "전선"],
  ["MBE4014", "학부연구(2)P", 2, 4000, "1,2", "전선"],
  ["MBE4015", "학부연구(3)P", 2, 4000, "1,2", "전선"],
  ["MBE4016", "학부연구(4)P", 2, 4000, "1,2", "전선"],
] as const;

const generalRows = [
  ["YHA1002", "채플", 2, "교양기초", "필수", "1-1, 1-2, 2-1, 2-2"],
  ["기독교의 이해", "기독교의 이해", 3, "교양기초", "필수", "1-2"],
  ["YHC1001", "글쓰기", 3, "교양기초", "필수", "1-1"],
  ["YHD1001", "교양영어 I", 2, "교양기초", "필수", "1-1"],
  ["YHD1002", "교양영어 II", 2, "교양기초", "필수", "1-2"],
  ["YHE1001", "리더십개발", 2, "교양기초", "필수", "1-1"],
  ["YHE1002", "리더십실습", 2, "교양기초", "필수", "1-2"],
  ["YHE1007", "대학학문의세계", 1, "교양기초", "필수", "1-1"],
  ["YHX1001", "컴퓨팅사고", 3, "교양기초", "필수", "1-2"],
  ["YHZ1001", "진로지도", 0, "교양기초", "필수", "2-1"],
  ["경력개발", "경력개발", 2, "교양기초", "필수", "2-2, 3-1, 3-2"],
  ["YHX1009", "컴퓨터프로그래밍", 3, "대학교양", "필수", "2-1"],
  ["1영역", "문학과예술", 3, "대학교양", "선택", ""],
  ["2영역", "인간과역사", 3, "대학교양", "선택", ""],
  ["3영역", "언어와표현", 3, "대학교양", "선택", ""],
  ["4영역", "가치와윤리", 3, "대학교양", "선택", ""],
  ["5영역", "국가와사회", 3, "대학교양", "선택", ""],
  ["6영역", "지역과세계", 3, "대학교양", "선택", ""],
  ["YHL1007", "미분적분학과벡터해석(1)", 3, "전공탐색", "필수", "1-1"],
  ["YHL1019", "공업수학(1)", 3, "전공탐색", "필수", "1-2"],
  ["YHL1020", "공업수학(2)", 3, "전공탐색", "필수", "2-1"],
  ["YHV1001", "일반물리학및실험(1)", 3, "전공탐색", "필수", "1-1"],
  ["YHV1003", "일반화학및실험(1)", 3, "전공탐색", "필수", "1-1"],
  ["YHN1002", "일반생물학및실험(1)", 3, "전공탐색", "필수", "1-1"],
  ["YHV1002", "일반물리학및실험(2)", 3, "전공탐색", "선택", "1-2"],
  ["YHV1004", "일반화학및실험(2)", 3, "전공탐색", "선택", "1-2"],
  ["YHN1003", "일반생물학및실험(2)", 3, "전공탐색", "선택", "1-2"],
] as const;

const secondaryRows = [
  ["MAI2002", "의료AI반도체산학연프로젝트", 3, "전공필수", "", "의료AI반도체융합전공", ""],
  ["SWE2004", "논리회로설계", 3, "공통교과목", "", "소프트웨어학부", "2학기"],
  ["SWE2010", "컴퓨터구조론", 3, "공통교과목", "", "소프트웨어학부", "1학기"],
  ["SWE3007", "마이크로프로세서", 3, "공통교과목", "", "소프트웨어학부", "1학기"],
  ["SWE3019", "디지탈신호처리", 3, "공통교과목", "", "소프트웨어학부", "2학기"],
  ["MBE2015", "디지털시스템및실험", 3, "공통교과목", "", "의공학부", "1학기"],
  ["MBE3028", "마이크로프로세서및실험", 3, "공통교과목", "", "의공학부", "2학기"],
  ["MEE3010", "의료영상신호처리", 3, "공통교과목", "", "의공학부", "2학기"],
  ["MAI2001", "의료데이터분석실무", 2, "공통교과목", "", "의료AI반도체융합전공", "2학기"],
  ["신설예정", "의료전문가초청세미나", 1, "공통교과목", "", "AI반도체학부", ""],
  ["SWE3016", "인공지능", 3, "Track 심화", "의료 AI 솔루션개발 Track", "소프트웨어학부", "2학기"],
  ["SWE4003", "기계학습개론", 3, "Track 심화", "의료 AI 솔루션개발 Track", "소프트웨어학부", "1학기"],
  ["SWE4015", "자연어처리", 3, "Track 심화", "의료 AI 솔루션개발 Track", "소프트웨어학부", "2학기"],
  ["SWE3006", "AI수학", 3, "Track 심화", "의료 AI 솔루션개발 Track", "소프트웨어학부", "2학기"],
  ["MBE3059", "의공학을위한기계학습", 3, "Track 심화", "의료 AI 솔루션개발 Track", "의공학부", "2학기"],
  ["SWE2008", "시스템프로그래밍", 3, "Track 심화", "의료 AI 솔루션개발 Track", "소프트웨어학부", "2학기"],
  ["SWE3014", "병렬프로그래밍", 3, "Track 심화", "의료 AI 솔루션개발 Track", "소프트웨어학부", "1학기"],
  ["SWE4001", "컴파일러설계", 3, "Track 심화", "의료 AI 솔루션개발 Track", "소프트웨어학부", "1학기"],
  ["SWE3022", "임베디드시스템", 3, "Track 심화", "의료 AI 솔루션개발 Track", "소프트웨어학부", "2학기"],
  ["DHC4006", "의료인공지능", 3, "Track 심화", "의료 AI 솔루션개발 Track", "디지털헬스케어학부", "1학기"],
  ["DHC3005", "헬스케어임베디드시스템", 3, "Track 심화", "의료 AI 솔루션개발 Track", "디지털헬스케어학부", "2학기"],
  ["DHC4001", "헬스케어응용SW", 3, "Track 심화", "의료 데이터 분석 Track", "디지털헬스케어학부", "2학기"],
  ["DHC4002", "의료빅데이터분석", 3, "Track 심화", "의료 데이터 분석 Track", "디지털헬스케어학부", "1학기"],
  ["DHC4003", "의료영상데이터분석", 3, "Track 심화", "의료 데이터 분석 Track", "디지털헬스케어학부", "1학기"],
  ["DHC2003", "보건의료통계", 3, "Track 심화", "의료 데이터 분석 Track", "디지털헬스케어학부", "2학기"],
  ["IST2009", "탐색적자료분석", 3, "Track 심화", "의료 데이터 분석 Track", "데이터사이언스학부", "2학기"],
  ["IST3013", "데이터마이닝", 3, "Track 심화", "의료 데이터 분석 Track", "데이터사이언스학부", "1학기"],
  ["IST3020", "실험계획법", 3, "Track 심화", "의료 데이터 분석 Track", "데이터사이언스학부", "1,2학기"],
  ["IST4010", "확률과정론", 3, "Track 심화", "의료 데이터 분석 Track", "데이터사이언스학부", "2학기"],
  ["SWE3017", "데이터베이스", 3, "Track 심화", "의료 데이터 분석 Track", "소프트웨어학부", "1학기"],
  ["SWE3018", "데이터마이닝", 3, "Track 심화", "의료 데이터 분석 Track", "소프트웨어학부", "2학기"],
  ["SWE4004", "빅데이터처리", 3, "Track 심화", "의료 데이터 분석 Track", "소프트웨어학부", "2학기"],
  ["ASD3005", "디지털VLSI설계", 3, "Track 심화", "의료 AI 반도체설계 Track", "AI반도체학부", "2학기"],
  ["신설예정", "EDA기반설계", 3, "Track 심화", "의료 AI 반도체설계 Track", "AI반도체학부", ""],
  ["ASD3002", "AI반도체설계", 3, "Track 심화", "의료 AI 반도체설계 Track", "AI반도체학부", "1학기"],
  ["ASD3008", "FPGA시스템설계", 3, "Track 심화", "의료 AI 반도체설계 Track", "AI반도체학부", "2학기"],
  ["신설예정", "프로세서설계", 3, "Track 심화", "의료 AI 반도체설계 Track", "AI반도체학부", ""],
  ["SWE2005", "회로이론", 3, "Track 심화", "의료 AI 반도체설계 Track", "소프트웨어학부", "1학기"],
  ["PHS2002", "기초전자", 3, "Track 심화", "의료 AI 반도체설계 Track", "물리및공학물리학", "1학기"],
  ["PHS3009", "전자기학(1)", 3, "Track 심화", "의료 AI 반도체설계 Track", "물리및공학물리학", "1학기"],
  ["PHS3010", "전자기학(2)", 3, "Track 심화", "의료 AI 반도체설계 Track", "물리및공학물리학", "2학기"],
  ["PHS4005", "고체물리학", 3, "Track 심화", "의료 AI 반도체설계 Track", "물리및공학물리학", "1학기"],
  ["PHS4016", "반도체공학", 3, "Track 심화", "의료 AI 반도체설계 Track", "물리및공학물리학", "2학기"],
  ["MBE2004", "회로이론및실습", 3, "Track 심화", "의료 AI 반도체설계 Track", "의공학부", "1학기"],
  ["MEE3014", "의료전자시스템및실험", 3, "Track 심화", "의료 AI 반도체설계 Track", "의공학부", "1학기"],
] as const;

const keyFor = (code: string, name: string) => code === "신설예정" ? `${code}:${name}` : code;
export const levelFor = (code: string) => Number(code.match(/\d{4}/)?.[0] ?? 0);
export const customCourseStatusId = (id: string) => `custom:${id}`;

export const primaryCourses: Course[] = primaryRows.map(([code, name, credits, level, semester, type]) => ({
  id: keyFor(code, name), code, name, credits, level, semester, category: "의공학전공",
  primaryType: type, source: "primary",
}));

export const generalCourses: Course[] = generalRows.map(([code, name, credits, category, subcategory, semester]) => ({
  id: `general:${keyFor(code, name)}`, code, name, credits, level: 1000, semester, category, subcategory,
  source: "general",
}));

export const secondaryCourses: Course[] = secondaryRows.map(([code, name, credits, category, track, department, semester]) => ({
  id: keyFor(code, name), code, name, credits, level: levelFor(code), semester, category,
  subcategory: track || undefined, department, source: "secondary",
}));

export function customCoursesFor(profile: Profile): Course[] {
  return profile.customCourses.map((course) => ({
    id: customCourseStatusId(course.id), code: course.code, name: course.name, credits: course.credits,
    level: levelFor(course.code), category: "추가 과목", source: "custom",
  }));
}

export const overlapIds = primaryCourses
  .filter((course) => secondaryCourses.some((other) => other.id === course.id))
  .map((course) => course.id);

export const statusOptions: CourseStatus[] = ["미이수", "이수", "수강중", "예정"];
export const trackOptions: Track[] = [
  "의료 AI 솔루션개발 Track", "의료 데이터 분석 Track", "의료 AI 반도체설계 Track",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isCourseStatus = (value: unknown): value is CourseStatus =>
  typeof value === "string" && statusOptions.includes(value as CourseStatus);
const isTrack = (value: unknown): value is Track =>
  typeof value === "string" && trackOptions.includes(value as Track);
const nonNegativeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
const validCustomCourse = (value: unknown): value is CustomCourse =>
  isRecord(value) && typeof value.id === "string" && Boolean(value.id) &&
  typeof value.code === "string" && Boolean(value.code.trim()) &&
  typeof value.name === "string" && Boolean(value.name.trim()) &&
  typeof value.credits === "number" && Number.isFinite(value.credits) && value.credits > 0;

const completedPrimary = [
  "MBE2003", "MBE2004", "MBE2015", "MBE2022", "MBE1003", "MBE2010", "MBE2023",
  "MRE3004", "MEE3014", "MRE4004",
];
const plannedPrimary = ["MBE3028", "MBE3051", "MBE4013"];
const completedGeneral = [
  "YHA1002", "기독교의 이해", "YHC1001", "YHD1001", "YHD1002", "YHE1001", "YHE1002",
  "YHE1007", "YHX1001", "YHZ1001", "YHX1009", "1영역", "2영역", "5영역", "YHL1007",
  "YHL1019", "YHL1020", "YHV1001", "YHV1003", "YHN1002", "YHV1004", "YHN1003",
];
const plannedSecondary = [
  "MAI2002", "SWE2010", "SWE3016", "SWE4003", "SWE4015", "SWE3006", "SWE3022", "ASD3005",
];

export function createProfile(name = "내 계획", useSample = true): Profile {
  const statuses: Record<string, CourseStatus> = {};
  [...primaryCourses, ...generalCourses, ...secondaryCourses].forEach((course) => {
    statuses[course.id] = "미이수";
  });
  if (useSample) {
    completedPrimary.forEach((id) => { statuses[id] = "이수"; });
    plannedPrimary.forEach((id) => { statuses[id] = "예정"; });
    completedGeneral.forEach((code) => {
      const course = generalCourses.find((item) => item.code === code);
      if (course) statuses[course.id] = "이수";
    });
    const career = generalCourses.find((item) => item.code === "경력개발");
    if (career) statuses[career.id] = "수강중";
    const valueEthics = generalCourses.find((item) => item.code === "4영역");
    if (valueEthics) statuses[valueEthics.id] = "예정";
    plannedSecondary.forEach((id) => { statuses[id] = "예정"; });
  }
  return {
    id: crypto.randomUUID(),
    name,
    selectedTrack: "의료 AI 솔루션개발 Track",
    statuses,
    customCourses: [],
    extraCredits: { current: 0, planned: 0, current3000: 0, planned3000: 0 },
    certifications: { language: false, practical: false },
    updatedAt: new Date().toISOString(),
  };
}

/** Normalizes backup data so incomplete files cannot break the planner. */
export function normalizeProfileBackup(value: unknown): Profile {
  if (!isRecord(value) || typeof value.name !== "string" || !value.name.trim() || !isRecord(value.statuses)) {
    throw new Error("invalid profile backup");
  }

  const profile = createProfile(value.name.trim(), false);
  const importedCustomCourses = Array.isArray(value.customCourses) ? value.customCourses : [];
  const importedExtraCredits = isRecord(value.extraCredits) ? value.extraCredits : {};
  const importedCertifications = isRecord(value.certifications) ? value.certifications : {};

  const existingCodes = new Set([...primaryCourses, ...generalCourses, ...secondaryCourses].map((course) => course.code.trim().toUpperCase()));
  const customCodes = new Set<string>();
  profile.customCourses = importedCustomCourses
    .filter(validCustomCourse)
    .map((course) => ({ ...course, code: course.code.trim(), name: course.name.trim(), credits: course.credits }))
    .filter((course) => {
      const code = course.code.toUpperCase();
      if (existingCodes.has(code) || customCodes.has(code)) return false;
      customCodes.add(code);
      return true;
    });
  profile.customCourses.forEach((course) => { profile.statuses[customCourseStatusId(course.id)] = "미이수"; });

  Object.entries(value.statuses).forEach(([id, status]) => {
    if (id in profile.statuses && isCourseStatus(status)) profile.statuses[id] = status;
  });
  profile.selectedTrack = isTrack(value.selectedTrack) ? value.selectedTrack : profile.selectedTrack;
  profile.extraCredits = {
    current: nonNegativeNumber(importedExtraCredits.current),
    planned: nonNegativeNumber(importedExtraCredits.planned),
    current3000: nonNegativeNumber(importedExtraCredits.current3000),
    planned3000: nonNegativeNumber(importedExtraCredits.planned3000),
  };
  profile.certifications = {
    language: importedCertifications.language === true,
    practical: importedCertifications.practical === true,
  };
  return profile;
}

/** Migrates locally saved profiles while dropping legacy manual-recognition data. */
export function normalizeStoredProfile(value: unknown): Profile {
  const profile = normalizeProfileBackup(value);
  if (isRecord(value) && typeof value.id === "string" && value.id) profile.id = value.id;
  if (isRecord(value) && typeof value.updatedAt === "string" && value.updatedAt) profile.updatedAt = value.updatedAt;
  return profile;
}
