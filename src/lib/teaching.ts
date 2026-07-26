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
