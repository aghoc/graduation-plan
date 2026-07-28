"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Theme } from "@astryxdesign/core";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Badge } from "@astryxdesign/core/Badge";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import {
  CheckCircle2, CircleAlert, Copy, Download, FileDown, GraduationCap, ListPlus, Plus, Search,
  Settings2, Trash2, Upload, XCircle,
} from "lucide-react";
import {
  createProfile, customCourseStatusId, customCoursesFor, generalCourses, normalizeProfileBackup, normalizeStoredProfile, primaryCourses,
  secondaryCourses, statusOptions, trackOptions, type Course, type CourseStatus,
  type CustomCourse, type Profile, type Track,
} from "../lib/catalog.ts";
import { evaluate, type RequirementResult, type RequirementState } from "../lib/evaluate.ts";
import { deleteProfile, getActiveProfileId, listProfiles, saveProfile, setActiveProfileId } from "../lib/storage.ts";

type View = "summary" | "primary" | "secondary" | "custom" | "settings";
type CourseFilter = "전체" | CourseStatus;
type ProfileDialogMode = "clone" | "blank" | null;

const statusSelectorOptions = statusOptions.map((value) => ({ value, label: value }));
const trackSelectorOptions = trackOptions.map((value) => ({ value, label: value }));

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState("");
  const [view, setView] = useState<View>("summary");
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("전체");
  const [profileDialogMode, setProfileDialogMode] = useState<ProfileDialogMode>(null);
  const [profileName, setProfileName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      let stored = (await listProfiles()).map(normalizeStoredProfile);
      if (!stored.length) {
        const initial = createProfile();
        await saveProfile(initial);
        stored = [initial];
      } else {
        await Promise.all(stored.map(saveProfile));
      }
      const preferred = getActiveProfileId();
      const selected = stored.some((profile) => profile.id === preferred) ? preferred! : stored[0].id;
      setProfiles(stored.sort((a, b) => a.name.localeCompare(b.name, "ko")));
      setActiveId(selected);
      setActiveProfileId(selected);
      setLoaded(true);
    })();
  }, []);

  const profile = profiles.find((item) => item.id === activeId);
  const report = useMemo(() => profile ? evaluate(profile) : null, [profile]);

  const updateProfile = (change: (current: Profile) => Profile) => {
    if (!profile) return;
    const next = { ...change(profile), updatedAt: new Date().toISOString() };
    setProfiles((items) => items.map((item) => item.id === next.id ? next : item));
    void saveProfile(next);
  };

  const setStatus = (course: Course, status: CourseStatus) => {
    updateProfile((current) => ({ ...current, statuses: { ...current.statuses, [course.id]: status } }));
  };

  const addCustomCourse = (course: CustomCourse, status: CourseStatus) => {
    updateProfile((current) => ({
      ...current,
      customCourses: [...current.customCourses, course],
      statuses: { ...current.statuses, [customCourseStatusId(course.id)]: status },
    }));
  };

  const removeCustomCourse = (id: string) => {
    updateProfile((current) => {
      const statuses = { ...current.statuses };
      delete statuses[customCourseStatusId(id)];
      return { ...current, customCourses: current.customCourses.filter((course) => course.id !== id), statuses };
    });
  };

  const openProfileDialog = (mode: Exclude<ProfileDialogMode, null>) => {
    setProfileDialogMode(mode);
    setProfileName(mode === "clone" ? `${profile?.name ?? "내 계획"} 복사` : "새 계획");
  };

  const createNewProfile = () => {
    if (!profileDialogMode || !profileName.trim()) return;
    const next = profileDialogMode === "clone" && profile
      ? { ...structuredClone(profile), id: crypto.randomUUID(), name: profileName.trim(), updatedAt: new Date().toISOString() }
      : createProfile(profileName.trim(), false);
    setProfiles((items) => [...items, next].sort((a, b) => a.name.localeCompare(b.name, "ko")));
    setActiveId(next.id);
    setActiveProfileId(next.id);
    void saveProfile(next);
    setProfileDialogMode(null);
  };

  const removeCurrentProfile = () => {
    if (!profile || profiles.length === 1) return;
    const remaining = profiles.filter((item) => item.id !== profile.id);
    setProfiles(remaining);
    setActiveId(remaining[0].id);
    setActiveProfileId(remaining[0].id);
    void deleteProfile(profile.id);
    setDeleteDialogOpen(false);
  };

  const exportJson = () => {
    if (!profile) return;
    downloadBlob(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), profile }, null, 2), `${profile.name}-졸업계획.json`, "application/json");
  };

  const exportXlsx = async () => {
    if (!profile || !report) return;
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const summary = [
      ["요건", "이수", "예정포함", "기준", "부족분", "판정"],
      ...report.requirements.map((item) => [item.label, item.currentDisplay ?? item.current, item.projectedDisplay ?? item.projected, item.target, item.shortage, item.state]),
      [],
      ["2전공 요건", "이수", "예정포함", "기준", "부족분", "판정"],
      ...report.secondRequirements.map((item) => [item.label, item.currentDisplay ?? item.current, item.projectedDisplay ?? item.projected, item.target, item.shortage, item.state]),
    ];
    const courses = [...primaryCourses, ...generalCourses, ...secondaryCourses, ...customCoursesFor(profile)].map((course) => [
      course.source === "primary" ? "의공학전공" : course.source === "general" ? "교양/전공탐색" : course.source === "secondary" ? "의료AI반도체융합전공" : "추가 과목",
      course.category, course.subcategory ?? "", course.code, course.name, course.credits, course.level || "",
      profile.statuses[course.id] ?? "미이수",
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "요건요약");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ["구분", "영역", "세부영역", "학정번호", "교과목명", "학점", "단위수", "이수여부"],
      ...courses,
    ]), "과목현황");
    XLSX.writeFile(workbook, `${profile.name}-졸업요건.xlsx`);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const imported = normalizeProfileBackup(parsed?.profile);
      const next = { ...imported, id: crypto.randomUUID(), name: `${imported.name} 복원`, updatedAt: new Date().toISOString() };
      await saveProfile(next);
      setProfiles((items) => [...items, next].sort((a, b) => a.name.localeCompare(b.name, "ko")));
      setActiveId(next.id);
      setActiveProfileId(next.id);
      setImportError("");
    } catch {
      setImportError("백업 파일 형식을 확인할 수 없습니다. 이 플래너에서 내보낸 JSON 파일을 선택해 주세요.");
    }
  };

  if (!loaded || !profile || !report) {
    return <main className="loading-screen">졸업요건을 불러오는 중입니다.</main>;
  }

  return (
    <Theme theme={neutralTheme} mode="light">
      <main className="app-shell">
        <header className="topbar">
          <section className="brand-lockup">
            <span className="brand-mark"><GraduationCap size={22} /></span>
            <span>
              <strong>졸업요건 플래너</strong>
              <small>의공학전공 · 의료AI반도체융합전공</small>
            </span>
          </section>
          <section className="profile-actions">
            <Selector
              label="프로필"
              isLabelHidden
              size="sm"
              value={profile.id}
              options={profiles.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(id) => { setActiveId(id); setActiveProfileId(id); }}
            />
            <IconButton label="프로필 복제" tooltip="프로필 복제" icon={<Copy size={16} />} size="sm" variant="ghost" onClick={() => openProfileDialog("clone")} />
            <IconButton label="빈 프로필 만들기" tooltip="빈 프로필 만들기" icon={<Plus size={16} />} size="sm" variant="ghost" onClick={() => openProfileDialog("blank")} />
          </section>
        </header>

        <nav className="view-tabs" aria-label="주요 화면">
          <TabList value={view} onChange={(value) => setView(value as View)} size="sm" hasDivider>
            <Tab value="summary" label="요건요약" />
            <Tab value="primary" label="의공학전공" />
            <Tab value="secondary" label="2전공과목" />
            <Tab value="custom" label="추가 과목" icon={<ListPlus size={15} />} />
            <Tab value="settings" label="설정" icon={<Settings2 size={15} />} />
          </TabList>
        </nav>

        {view === "summary" && <SummaryView report={report} profile={profile} />}
        {view === "primary" && (
          <CourseView
            title="의공학전공 · 교양 · 전공탐색"
            courses={[...primaryCourses, ...generalCourses]}
            sections={[
              { id: "primary", title: "의공학전공", courses: primaryCourses },
              { id: "general-base", title: "교양기초", courses: generalCourses.filter((course) => course.category === "교양기초") },
              { id: "university", title: "대학교양", courses: generalCourses.filter((course) => course.category === "대학교양") },
              { id: "exploration", title: "전공탐색", courses: generalCourses.filter((course) => course.category === "전공탐색") },
            ]}
            profile={profile}
            query={query}
            filter={courseFilter}
            onQuery={setQuery}
            onFilter={setCourseFilter}
            onStatus={setStatus}
          />
        )}
        {view === "secondary" && (
          <CourseView
            title="의료AI반도체융합전공"
            courses={secondaryCourses}
            profile={profile}
            query={query}
            filter={courseFilter}
            onQuery={setQuery}
            onFilter={setCourseFilter}
            onStatus={setStatus}
            selectedTrack={profile.selectedTrack}
          />
        )}
        {view === "custom" && <CustomCourseView profile={profile} onStatus={setStatus} onAdd={addCustomCourse} onRemove={removeCustomCourse} />}
        {view === "settings" && (
          <SettingsView
            profile={profile}
            profilesCount={profiles.length}
            onUpdate={updateProfile}
            onExportJson={exportJson}
            onExportXlsx={exportXlsx}
            onImport={() => fileInput.current?.click()}
            onDelete={() => setDeleteDialogOpen(true)}
            importError={importError}
          />
        )}
        <input
          ref={fileInput}
          className="hidden-input"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importJson(file);
            event.target.value = "";
          }}
        />
        <Dialog
          isOpen={profileDialogMode !== null}
          onOpenChange={(isOpen) => { if (!isOpen) setProfileDialogMode(null); }}
          purpose="form"
          width={420}
        >
          <section className="profile-dialog">
            <DialogHeader
              title={profileDialogMode === "clone" ? "프로필 복제" : "빈 프로필 만들기"}
              onOpenChange={(isOpen) => { if (!isOpen) setProfileDialogMode(null); }}
            />
            <TextInput
              label="프로필 이름"
              value={profileName}
              onChange={setProfileName}
              placeholder="예: 2026학년도 계획"
            />
            <section className="dialog-actions">
              <Button label="취소" variant="ghost" onClick={() => setProfileDialogMode(null)} />
              <Button label={profileDialogMode === "clone" ? "복제" : "만들기"} variant="primary" onClick={createNewProfile} isDisabled={!profileName.trim()} />
            </section>
          </section>
        </Dialog>
        <AlertDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="현재 프로필을 삭제할까요?"
          description={`\"${profile.name}\" 프로필과 저장된 이수 상태가 삭제됩니다.`}
          actionLabel="삭제"
          cancelLabel="취소"
          onAction={removeCurrentProfile}
        />
      </main>
    </Theme>
  );
}

function SummaryView({ report, profile }: { report: ReturnType<typeof evaluate>; profile: Profile }) {
  const shortage = Math.max(0, 135 - report.totalProjected);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailItem = [...report.requirements, ...report.secondRequirements].find((item) => item.id === detailId);
  const detail = detailItem ? report.calculationDetails[detailItem.id] : undefined;
  return (
    <section className="page-content">
      <header className="page-heading">
        <span>
          <h1>{profile.name}</h1>
          <p>{profile.selectedTrack}</p>
        </span>
        <StateBadge state={report.overallState} />
      </header>
      <section className="metric-grid">
        <Metric label="총 졸업학점" current={report.totalCurrent} projected={report.totalProjected} target={135} suffix="학점" />
        <Metric label="3000단위 이상" current={report.level3000Current} projected={report.level3000Projected} target={45} suffix="학점" />
        <Metric label="2전공 이수학점" current={report.secondCurrentCredits} projected={report.secondProjectedCredits} target={36} suffix="학점" />
        <Metric label="남은 졸업학점" current={shortage} projected={shortage} target={135} suffix="학점" isShortage />
      </section>
      <RequirementTable title="통합 졸업요건" items={report.requirements} onDetail={setDetailId} />
      <RequirementTable title="의료AI반도체융합전공" items={report.secondRequirements} onDetail={setDetailId} />
      <CalculationDialog item={detailItem} detail={detail} isOpen={detailId !== null} onClose={() => setDetailId(null)} />
    </section>
  );
}

function Metric({ label, current, projected, target, suffix, isShortage = false }: {
  label: string; current: number; projected: number; target: number; suffix: string; isShortage?: boolean;
}) {
  const value = isShortage ? projected : Math.min(projected, target);
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{projected}<small>{suffix}</small></strong>
      <span>{isShortage ? `예정 포함 기준` : `현재 ${current}${suffix}`}</span>
      <ProgressBar
        label={label}
        isLabelHidden
        value={isShortage ? Math.max(0, target - projected) : value}
        max={target}
        variant={isShortage ? (projected === 0 ? "success" : "warning") : projected >= target ? "success" : "accent"}
      />
    </article>
  );
}

function RequirementTable({ title, items, onDetail }: { title: string; items: RequirementResult[]; onDetail: (id: string) => void }) {
  return (
    <section className="table-section">
      <header className="section-header"><h2>{title}</h2></header>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>요건</th><th>이수</th><th>예정포함</th><th>기준</th><th>부족분</th><th>판정</th><th aria-label="상세보기" /></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} data-state={item.state}>
                <th scope="row">{item.label}</th>
                <td>{item.currentDisplay ?? item.current}</td>
                <td>{item.projectedDisplay ?? item.projected}</td>
                <td>{item.target}</td>
                <td>{item.shortage}</td>
                <td><StateBadge state={item.state} /></td>
                <td className="detail-cell"><Button label="상세보기" size="sm" variant="ghost" onClick={() => onDetail(item.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CalculationDialog({ item, detail, isOpen, onClose }: {
  item?: RequirementResult; detail?: ReturnType<typeof evaluate>["calculationDetails"][string]; isOpen: boolean; onClose: () => void;
}) {
  if (!item || !detail) return null;
  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} purpose="info" width={980}>
      <section className="calculation-dialog">
        <DialogHeader title={`${item.label} 계산 상세`} onOpenChange={(open) => { if (!open) onClose(); }} />
        <p className="calculation-description">{detail.description}</p>
        <dl className="calculation-summary">
          <div><dt>이수</dt><dd>{item.currentDisplay ?? item.current}</dd></div>
          <div><dt>예정 포함</dt><dd>{item.projectedDisplay ?? item.projected}</dd></div>
          <div><dt>기준</dt><dd>{item.target}</dd></div>
          <div><dt>판정</dt><dd><StateBadge state={item.state} /></dd></div>
        </dl>
        {detail.lines.length ? (
          <div className="table-scroll calculation-table-scroll">
            <table className="data-table calculation-table">
              <thead><tr><th>학정번호</th><th>반영 항목</th><th>학점</th><th>이수여부</th><th>현재 반영</th><th>예정 포함</th><th>비고</th></tr></thead>
              <tbody>
                {detail.lines.map((line, index) => (
                  <tr key={`${line.code ?? line.label}-${index}`} data-course-status={line.status}>
                    <td className="code-cell">{line.code ?? "-"}</td>
                    <th scope="row">{line.label}</th>
                    <td>{line.credits ?? "-"}</td>
                    <td>{line.status}</td>
                    <td>{line.current ? "반영" : "-"}</td>
                    <td>{line.projected ? "반영" : "-"}</td>
                    <td>{line.note ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="calculation-empty">현재 반영되는 과목이 없습니다.</p>}
      </section>
    </Dialog>
  );
}

type CourseSection = { id: string; title: string; courses: Course[] };

function CourseView({ title, courses, sections, profile, query, filter, onQuery, onFilter, onStatus, selectedTrack }: {
  title: string; courses: Course[]; profile: Profile; query: string; filter: CourseFilter;
  sections?: CourseSection[];
  onQuery: (value: string) => void; onFilter: (value: CourseFilter) => void;
  onStatus: (course: Course, status: CourseStatus) => void; selectedTrack?: Track;
}) {
  const filterCourses = (items: Course[]) => items.filter((course) => {
    const status = profile.statuses[course.id] ?? "미이수";
    const matchesStatus = filter === "전체" || status === filter;
    const text = `${course.code} ${course.name} ${course.category} ${course.subcategory ?? ""} ${course.department ?? ""}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  });
  const filtered = filterCourses(courses);
  const visibleSections = (sections ?? [{ id: "all", title, courses }])
    .map((section) => ({ ...section, filtered: filterCourses(section.courses) }))
    .filter((section) => section.filtered.length > 0);
  return (
    <section className="page-content">
      <header className="page-heading"><span><h1>{title}</h1><p>{filtered.length}개 과목</p></span></header>
      <section className="course-toolbar">
        <TextInput label="과목 검색" isLabelHidden value={query} onChange={onQuery} startIcon={Search} hasClear size="sm" placeholder="학정번호, 과목명, 영역 검색" />
        <SegmentedControl value={filter} onChange={(value) => onFilter(value as CourseFilter)} label="이수 상태 필터" size="sm">
          {(["전체", ...statusOptions] as CourseFilter[]).map((value) => <SegmentedControlItem key={value} value={value} label={value} />)}
        </SegmentedControl>
      </section>
      {visibleSections.map((section) => (
        <CourseTable key={section.id} title={section.title} courses={section.filtered} profile={profile} onStatus={onStatus} selectedTrack={selectedTrack} />
      ))}
    </section>
  );
}

function CourseTable({ title, courses, profile, onStatus, selectedTrack }: {
  title: string; courses: Course[]; profile: Profile; onStatus: (course: Course, status: CourseStatus) => void; selectedTrack?: Track;
}) {
  return (
    <section className="table-section">
      <header className="section-header"><h2>{title}</h2><span>{courses.length}개 과목</span></header>
      <div className="table-scroll">
        <table className="data-table course-table">
          <thead><tr><th>영역</th><th>학정번호</th><th>교과목명</th><th>개설</th><th>학점</th><th>이수여부</th></tr></thead>
          <tbody>
            {courses.map((course) => {
              const status = profile.statuses[course.id] ?? "미이수";
              return (
                <tr key={`${course.source}:${course.id}`} data-course-status={status} data-selected-track={selectedTrack && course.subcategory === selectedTrack ? "true" : undefined}>
                  <td>{course.primaryType === "전필" ? "전공필수" : course.primaryType === "전선" ? "전공선택" : course.subcategory || course.category}</td>
                  <td className="code-cell">{course.code}</td>
                  <th scope="row">{course.name}</th>
                  <td>{course.semester || course.department || "-"}</td>
                  <td>{course.credits}</td>
                  <td className="control-cell">
                    <Selector
                      label={`${course.name} 이수여부`}
                      isLabelHidden
                      size="sm"
                      value={status}
                      options={statusSelectorOptions}
                      onChange={(value) => onStatus(course, value as CourseStatus)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CustomCourseView({ profile, onStatus, onAdd, onRemove }: {
  profile: Profile;
  onStatus: (course: Course, status: CourseStatus) => void;
  onAdd: (course: CustomCourse, status: CourseStatus) => void;
  onRemove: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [status, setStatus] = useState<CourseStatus>("미이수");
  const [error, setError] = useState("");
  const courses = customCoursesFor(profile);
  const catalogCodes = new Set([...primaryCourses, ...generalCourses, ...secondaryCourses, ...profile.customCourses]
    .map((course) => course.code.trim().toUpperCase()));
  const openDialog = () => {
    setName("");
    setCode("");
    setCredits("3");
    setStatus("미이수");
    setError("");
    setIsOpen(true);
  };
  const addCourse = () => {
    const normalizedCode = code.trim().toUpperCase();
    const numericCredits = Number(credits);
    if (!name.trim() || !normalizedCode || !Number.isFinite(numericCredits) || numericCredits <= 0) {
      setError("과목명, 학정번호, 0보다 큰 학점을 입력해 주세요.");
      return;
    }
    if (catalogCodes.has(normalizedCode)) {
      setError("같은 학정번호의 과목이 이미 등록되어 있습니다.");
      return;
    }
    onAdd({ id: crypto.randomUUID(), name: name.trim(), code: normalizedCode, credits: numericCredits }, status);
    setIsOpen(false);
  };
  return (
    <section className="page-content">
      <header className="page-heading">
        <span><h1>추가 과목</h1><p>총 졸업학점에 반영되며, 학정번호가 3000단위 이상이면 3000단위에도 반영됩니다.</p></span>
        <Button label="과목 추가" icon={<Plus size={16} />} variant="primary" onClick={openDialog} />
      </header>
      <section className="table-section">
        <div className="table-scroll">
          <table className="data-table course-table custom-course-table">
            <thead><tr><th>학정번호</th><th>교과목명</th><th>학점</th><th>자동 반영</th><th>이수여부</th><th aria-label="삭제" /></tr></thead>
            <tbody>
              {courses.map((course) => {
                const statusValue = profile.statuses[course.id] ?? "미이수";
                return (
                  <tr key={course.id} data-course-status={statusValue}>
                    <td className="code-cell">{course.code}</td>
                    <th scope="row">{course.name}</th>
                    <td>{course.credits}</td>
                    <td>{course.level >= 3000 ? "총학점 · 3000단위" : "총학점"}</td>
                    <td className="control-cell">
                      <Selector label={`${course.name} 이수여부`} isLabelHidden size="sm" value={statusValue} options={statusSelectorOptions} onChange={(value) => onStatus(course, value as CourseStatus)} />
                    </td>
                    <td className="icon-cell"><IconButton label={`${course.name} 삭제`} tooltip="삭제" icon={<Trash2 size={16} />} size="sm" variant="ghost" onClick={() => onRemove(course.id.replace("custom:", ""))} /></td>
                  </tr>
                );
              })}
              {!courses.length && <tr><td colSpan={6} className="empty-table-cell">등록한 추가 과목이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <Dialog isOpen={isOpen} onOpenChange={setIsOpen} purpose="form" width={460}>
        <section className="profile-dialog">
          <DialogHeader title="추가 과목 등록" onOpenChange={setIsOpen} />
          <TextInput label="과목명" value={name} onChange={setName} placeholder="예: 타학과 전공 과목" />
          <TextInput label="학정번호" value={code} onChange={setCode} placeholder="예: ABC3001" />
          <label className="custom-credit-input"><span>학점</span><input type="number" min="0.5" step="0.5" value={credits} onChange={(event) => setCredits(event.target.value)} /></label>
          <Selector label="이수여부" value={status} options={statusSelectorOptions} onChange={(value) => setStatus(value as CourseStatus)} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <section className="dialog-actions">
            <Button label="취소" variant="ghost" onClick={() => setIsOpen(false)} />
            <Button label="등록" variant="primary" onClick={addCourse} />
          </section>
        </section>
      </Dialog>
    </section>
  );
}

function SettingsView({ profile, profilesCount, onUpdate, onExportJson, onExportXlsx, onImport, onDelete, importError }: {
  profile: Profile; profilesCount: number; onUpdate: (change: (current: Profile) => Profile) => void;
  onExportJson: () => void; onExportXlsx: () => void; onImport: () => void; onDelete: () => void; importError: string;
}) {
  return (
    <section className="page-content settings-page">
      <header className="page-heading"><span><h1>설정</h1><p>프로필과 계산 기준</p></span></header>
      <section className="settings-band">
        <h2>프로필</h2>
        <TextInput label="프로필 이름" value={profile.name} onChange={(name) => onUpdate((current) => ({ ...current, name }))} />
        <Selector label="선택 Track" value={profile.selectedTrack} options={trackSelectorOptions} onChange={(track) => onUpdate((current) => ({ ...current, selectedTrack: track as Track }))} />
      </section>
      <section className="settings-band">
        <h2>인증</h2>
        <label className="check-row">
          <input type="checkbox" checked={profile.certifications.language} onChange={(event) => onUpdate((current) => ({ ...current, certifications: { ...current.certifications, language: event.target.checked } }))} />
          <span>외국어인증</span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={profile.certifications.practical} onChange={(event) => onUpdate((current) => ({ ...current, certifications: { ...current.certifications, practical: event.target.checked } }))} />
          <span>정보인증 또는 산업실무역량인증</span>
        </label>
      </section>
      <section className="settings-band">
        <h2>기타 학점</h2>
        <div className="number-grid">
          {([
            ["current", "기타 이수학점"], ["planned", "기타 예정학점"],
            ["current3000", "기타 3000단위 이수"], ["planned3000", "기타 3000단위 예정"],
          ] as const).map(([key, label]) => (
            <label key={key}><span>{label}</span><input type="number" min="0" value={profile.extraCredits[key]} onChange={(event) => onUpdate((current) => ({ ...current, extraCredits: { ...current.extraCredits, [key]: Math.max(0, Number(event.target.value) || 0) } }))} /></label>
          ))}
        </div>
      </section>
      <section className="settings-band">
        <h2>백업 및 내보내기</h2>
        <div className="button-row">
          <Button label="JSON 백업" icon={<Download size={16} />} onClick={onExportJson} />
          <Button label="백업 복원" icon={<Upload size={16} />} onClick={onImport} />
          <Button label="엑셀 내보내기" variant="primary" icon={<FileDown size={16} />} clickAction={onExportXlsx} />
        </div>
        {importError && <p className="form-error" role="alert">{importError}</p>}
      </section>
      <section className="settings-band danger-band">
        <h2>프로필 삭제</h2>
        <Button label="현재 프로필 삭제" variant="destructive" icon={<Trash2 size={16} />} isDisabled={profilesCount === 1} onClick={onDelete} />
      </section>
    </section>
  );
}

function StateBadge({ state }: { state: RequirementState }) {
  const config = {
    "충족": { variant: "success" as const, icon: <CheckCircle2 size={14} /> },
    "충족예정": { variant: "info" as const, icon: <CheckCircle2 size={14} /> },
    "부족": { variant: "warning" as const, icon: <CircleAlert size={14} /> },
    "확인 필요": { variant: "error" as const, icon: <XCircle size={14} /> },
  }[state];
  return <Badge variant={config.variant} icon={config.icon} label={state} />;
}

function downloadBlob(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
