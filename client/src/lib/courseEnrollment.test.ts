import { describe, expect, it } from 'vitest';
import {
  buildEnrollmentId,
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
});
