import { describe, expect, it } from 'vitest';
import { normalizeCourseEntry, matchesCourseSearch } from './courseEnrollment';

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
});
