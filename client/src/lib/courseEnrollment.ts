export type LecturerCourseInput = {
  code?: string;
  title?: string;
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

export function matchesCourseSearch(course: NormalizedCourse, searchText: string) {
  const query = searchText.trim().toLowerCase();
  if (!query) return true;

  return (
    course.code.toLowerCase().includes(query) || course.title.toLowerCase().includes(query)
  );
}
