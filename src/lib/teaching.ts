import { getEntry } from 'astro:content';

export interface CourseSemester {
  semester: string;
  parallel: string;
  evaluationUrl: string | null;
  status?: 'completed' | 'in-progress' | 'upcoming';
}

function normalizeCourseName(value: string): string {
  return value.trim().toUpperCase();
}

function semesterSortKey(semester: string): number {
  const [year, term] = semester.split('-');
  return Number(year) * 10 + Number(term?.replace('S', '') ?? 0);
}

// Combines the historical SAAC evaluation records with the current
// `courses.yaml` semesters for a given real course code — mirrors the
// merge logic in src/pages/teaching/index.astro (see `historicalNames`,
// DOCUMENTATION.md §4.1/§4.2) so a course's syllabus detail page can show
// the same "taught N times" count and evaluation links as its card,
// without duplicating that matching logic a third time.
export async function getSemestersForCode(code: string): Promise<CourseSemester[]> {
  const coursesEntry = await getEntry('courses', 'data');
  const evaluacionesEntry = await getEntry('evaluaciones', 'data');
  const courses = coursesEntry.data.courses;
  const evaluations = evaluacionesEntry.data.evaluations;

  const historicalNameToCourse = new Map<string, (typeof courses)[number]>();
  for (const course of courses) {
    for (const historicalName of course.historicalNames) {
      historicalNameToCourse.set(normalizeCourseName(historicalName), course);
    }
  }

  const courseIdToRealCode = new Map<string, string>();
  for (const evaluation of evaluations) {
    const matched = historicalNameToCourse.get(normalizeCourseName(evaluation.courseName));
    if (matched) courseIdToRealCode.set(matched.courseId, evaluation.courseCode);
  }

  const historicalSemesters: CourseSemester[] = evaluations
    .filter((e) => e.courseCode === code)
    .map((r) => ({
      semester: `${r.year}-${r.academicPeriod}`,
      parallel: r.parallel,
      evaluationUrl: r.evaluationUrl,
      status: 'completed',
    }));

  const currentSemesters: CourseSemester[] = courses
    .filter((c) => {
      const realCode = c.code && c.code !== '[PROPORCIONAR]' ? c.code : courseIdToRealCode.get(c.courseId);
      return realCode === code;
    })
    .flatMap((c) => c.semesters);

  return [...historicalSemesters, ...currentSemesters].sort(
    (a, b) => semesterSortKey(b.semester) - semesterSortKey(a.semester)
  );
}

// Same palette as the Teaching timeline legend (src/pages/teaching/index.astro)
// — kept as a separate literal rather than a shared import so a change to
// one doesn't silently reflow the other's already-live color assignment.
const COURSE_COLORS = [
  'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
  'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
];

// Official English translations for historical SAAC course names — mirrors
// src/pages/teaching/index.astro's COURSE_NAME_TRANSLATIONS, needed here too
// so a course name coming from an evaluation record resolves to the same
// display name (and therefore the same color/anchor) on both pages.
const COURSE_NAME_TRANSLATIONS: Record<string, string> = {
  'Calidad de Servicio y Redes Multimedia': 'Quality of Service and Multimedia Networks',
  'Estructuras de Datos': 'Data Structures',
  'Fundamentos de Programación': 'Programming Fundamentals',
  Internetworking: 'Internetworking',
  'Programación de Sistemas Telemáticos': 'Telematics Systems Programming',
  'Redes Inalámbricas y de Sensores': 'Wireless and Sensor Networks',
  'Redes de Datos': 'Data Networks',
  'Sistemas Distribuidos y Computación en la Nube': 'Distributed Systems and Cloud Computing',
  'Telemetría y Sistemas Ciberfísicos': 'Telemetry and Cyber-Physical Systems',
};

export interface CourseColorEntry {
  badgeClass: string;
  anchor: string;
}

// One stable color + Teaching-page anchor per course name, for use anywhere
// outside /teaching that references a course by its display name (currently:
// the "Courses Taught" labels on Experience cards). Already-taught courses
// are assigned colors in the same alphabetical order as the Teaching
// timeline legend, so the colors match 1:1; courses that only have an
// upcoming (not-yet-taught) semester are appended afterward so they don't
// shift the palette already in use on the Teaching page.
export async function getCourseColorMap(): Promise<Map<string, CourseColorEntry>> {
  const coursesEntry = await getEntry('courses', 'data');
  const evaluacionesEntry = await getEntry('evaluaciones', 'data');
  const courses = coursesEntry.data.courses;
  const evaluations = evaluacionesEntry.data.evaluations;

  const normalizedTranslations = new Map(
    Object.entries(COURSE_NAME_TRANSLATIONS).map(([es, en]) => [normalizeCourseName(es), en])
  );

  const historicalNameToCourse = new Map<string, (typeof courses)[number]>();
  for (const course of courses) {
    for (const historicalName of course.historicalNames) {
      historicalNameToCourse.set(normalizeCourseName(historicalName), course);
    }
  }

  function displayCourseName(rawName: string): string {
    const normalized = normalizeCourseName(rawName);
    const matched = historicalNameToCourse.get(normalized);
    return matched ? matched.name : (normalizedTranslations.get(normalized) ?? rawName);
  }

  function anchorFor(rawName: string, courseCode: string): string {
    const matched = historicalNameToCourse.get(normalizeCourseName(rawName));
    return matched ? `course-${matched.courseId}` : `course-${courseCode}`;
  }

  const taught = new Map<string, string>();
  for (const e of evaluations) {
    taught.set(displayCourseName(e.courseName), anchorFor(e.courseName, e.courseCode));
  }
  for (const c of courses) {
    if (c.semesters.some((s) => s.status !== 'upcoming')) taught.set(c.name, `course-${c.courseId}`);
  }

  const upcoming = new Map<string, string>();
  for (const c of courses) {
    if (!taught.has(c.name) && c.semesters.length > 0) upcoming.set(c.name, `course-${c.courseId}`);
  }

  const orderedNames = [...Array.from(taught.keys()).sort(), ...Array.from(upcoming.keys()).sort()];
  const map = new Map<string, CourseColorEntry>();
  orderedNames.forEach((name, i) => {
    map.set(name, {
      badgeClass: COURSE_COLORS[i % COURSE_COLORS.length],
      anchor: taught.get(name) ?? upcoming.get(name)!,
    });
  });
  return map;
}
