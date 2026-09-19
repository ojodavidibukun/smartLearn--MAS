export type LecturerCourseInput = {
  code?: string;
  title?: string;
};

export type AcademicPeriod = {
  semester: string;
  session: string;
};

export type NormalizedCourse = {
  code: string;
  title: string;
  key: string;
};

export function normalizeCourseEntry(course: LecturerCourseInput): NormalizedCourse {
  const code = (course.code ?? '').trim().toUpperCase();
  const title = (course.title ?? '').trim();

  return {
    code,
    title,
    key: `${code}|${title}`,
  };
}

export function normalizeAcademicPeriod(period: Partial<AcademicPeriod>): AcademicPeriod {
  const semester = (period.semester ?? 'First Semester').trim() || 'First Semester';
  const session = (period.session ?? '2026/2027').trim() || '2026/2027';

  return {
    semester,
    session,
  };
}

export function buildEnrollmentId(
  studentId: string,
  lecturerId: string,
  courseCode: string,
  _academicPeriod?: AcademicPeriod,
) {
  return `${studentId}_${lecturerId}_${courseCode}`;
}

export function findCourseForEnrollment(
  enrollment: { courseId?: string; lecturerId?: string; courseCode?: string },
  courses: Array<{ id?: string; lecturerId?: string; courseCode?: string; courseTitle?: string }>,
) {
  const byCourseId = enrollment.courseId
    ? courses.find((course) => course.id === enrollment.courseId)
    : undefined;

  if (byCourseId) return byCourseId;

  return courses.find(
    (course) =>
      course.lecturerId === enrollment.lecturerId &&
      normalizeCourseEntry({ code: course.courseCode, title: course.courseTitle }).code ===
        normalizeCourseEntry({ code: enrollment.courseCode, title: '' }).code,
  );
}

export function matchesCourseSearch(course: NormalizedCourse, searchText: string) {
  const query = searchText.trim().toLowerCase();
  if (!query) return true;

  return (
    course.code.toLowerCase().includes(query) || course.title.toLowerCase().includes(query)
  );
}
