import { describe, expect, it } from 'vitest';
import { buildCourseNotificationTargets } from './notifications';

describe('course notification targeting', () => {
  it('only returns students enrolled in the specific course', () => {
    const enrollments = [
      { studentId: 'student-1', courseId: 'course-1' },
      { studentId: 'student-2', courseId: 'course-2' },
      { studentId: 'student-3', courseId: 'course-1' },
    ];

    expect(buildCourseNotificationTargets('course-1', enrollments)).toEqual(['student-1', 'student-3']);
  });
});
