import { describe, expect, it } from 'vitest';
import {
  buildEnrollmentId,
  findCourseForEnrollment,
  matchesCourseSearch,
  normalizeAcademicPeriod,
  normalizeCourseEntry,
} from './courseEnrollment';

describe('course enrollment helpers', () => {
  it('normalizes lecturer course entries', () => {
    expect(
      normalizeCourseEntry({ code: '  cpe310  ', title: '  Agent-Based Technology  ' }),
    ).toEqual({
      code: 'CPE310',
      title: 'Agent-Based Technology',
      key: 'CPE310|Agent-Based Technology',
    });
  });

  it('matches search by course code or title', () => {
    const course = normalizeCourseEntry({ code: 'CPE311', title: 'Computer Architecture' });

    expect(matchesCourseSearch(course, 'cpe311')).toBe(true);
    expect(matchesCourseSearch(course, 'architecture')).toBe(true);
    expect(matchesCourseSearch(course, 'biology')).toBe(false);
  });

  it('normalizes academic periods and creates stable enrollment ids', () => {
    const academicPeriod = normalizeAcademicPeriod({
      semester: 'First Semester',
      session: '2026/2027',
    });

    expect(academicPeriod).toEqual({
      semester: 'First Semester',
      session: '2026/2027',
    });

    expect(
      buildEnrollmentId('student-1', 'lecturer-1', 'CPE310', academicPeriod),
    ).toBe('student-1_lecturer-1_CPE310');
  });

  it('resolves enrollments using courseId first and then falls back to the lecturer/course code tuple', () => {
    const courses = [
      {
        id: 'course-123',
        lecturerId: 'lecturer-1',
        courseCode: 'CPE310',
        courseTitle: 'Agent-Based Technology',
      },
    ];

    const enrollmentByCourseId = {
      studentId: 'student-1',
      lecturerId: 'lecturer-1',
      courseId: 'course-123',
      courseCode: 'CPE310',
    } as any;

    const enrollmentByFallback = {
      studentId: 'student-1',
      lecturerId: 'lecturer-1',
      courseCode: 'CPE310',
    } as any;

    expect(findCourseForEnrollment(enrollmentByCourseId, courses)).toBe(courses[0]);
    expect(findCourseForEnrollment(enrollmentByFallback, courses)).toBe(courses[0]);
  });
});
