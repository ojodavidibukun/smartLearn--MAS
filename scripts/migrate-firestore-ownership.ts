import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const applyChanges = process.argv.includes('--apply');

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}

const db = getFirestore();

type Course = {
  id: string;
  lecturerId?: string;
  courseCode?: string;
};

type Enrollment = {
  id: string;
  studentId?: string;
  lecturerId?: string;
  courseCode?: string;
  courseId?: string;
};

type LegacyCourseEntry = {
  code?: string;
  title?: string;
};

function courseKey(lecturerId: string, courseCode: string) {
  return `${lecturerId}\u0000${courseCode}`;
}

function normalizeLegacyCourseEntry(course: LegacyCourseEntry | null | undefined) {
  if (!course) return null;

  const code = String(course.code ?? '').trim().toUpperCase();
  const title = String(course.title ?? '').trim();

  if (!code || !title) return null;

  return { code, title };
}

async function main() {
  const coursesSnapshot = await db.collection('courses').get();
  const courses = coursesSnapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<Course, 'id'>),
  }));

  const coursesByKey = new Map<string, Course[]>();
  for (const course of courses) {
    if (!course.lecturerId || !course.courseCode) continue;
    const key = courseKey(course.lecturerId, course.courseCode);
    const matches = coursesByKey.get(key) || [];
    matches.push(course);
    coursesByKey.set(key, matches);
  }

  const usersSnapshot = await db.collection('users').get();
  const problems: string[] = [];
  const legacyCourseBackfills: Array<{
    lecturerId: string;
    lecturerName: string;
    courseCode: string;
    courseTitle: string;
  }> = [];
  const seenLegacyCourseKeys = new Set<string>();

  for (const userDocument of usersSnapshot.docs) {
    const profile = userDocument.data() as { fullName?: string; offeredCourses?: LegacyCourseEntry[] };
    const offeredCourses = Array.isArray(profile.offeredCourses) ? profile.offeredCourses : [];
    if (!offeredCourses.length) continue;

    for (const course of offeredCourses) {
      const normalized = normalizeLegacyCourseEntry(course);
      if (!normalized) {
        problems.push(`users/${userDocument.id}: invalid offeredCourses entry`);
        continue;
      }

      const key = courseKey(userDocument.id, normalized.code);
      if (seenLegacyCourseKeys.has(key)) continue;
      seenLegacyCourseKeys.add(key);

      const matches = coursesByKey.get(key) || [];
      const hasEquivalentTitle = matches.some(
        (existing) => existing.courseTitle && existing.courseTitle.trim().toLowerCase() === normalized.title.toLowerCase(),
      );

      if (hasEquivalentTitle) continue;

      legacyCourseBackfills.push({
        lecturerId: userDocument.id,
        lecturerName: typeof profile.fullName === 'string' && profile.fullName.trim() ? profile.fullName.trim() : 'Lecturer',
        courseCode: normalized.code,
        courseTitle: normalized.title,
      });
    }
  }

  const enrollmentSnapshot = await db.collection('enrollments').get();
  const progressSnapshot = await db.collection('courseProgress').get();
  const updates: Array<{ path: string; data: Record<string, unknown> }> = [];

  for (const document of enrollmentSnapshot.docs) {
    const enrollment = { id: document.id, ...(document.data() as Omit<Enrollment, 'id'>) };
    if (enrollment.courseId) continue;
    if (!enrollment.studentId || !enrollment.lecturerId || !enrollment.courseCode) {
      problems.push(`enrollments/${document.id}: missing studentId, lecturerId, or courseCode`);
      continue;
    }

    const matches = coursesByKey.get(courseKey(enrollment.lecturerId, enrollment.courseCode)) || [];
    if (matches.length !== 1) {
      problems.push(`enrollments/${document.id}: found ${matches.length} matching courses`);
      continue;
    }

    updates.push({
      path: `enrollments/${document.id}`,
      data: { courseId: matches[0].id },
    });
  }

  const courseIds = courses.map((course) => course.id).sort((left, right) => right.length - left.length);
  for (const document of progressSnapshot.docs) {
    const data = document.data() as { courseId?: string; studentId?: string };
    if (data.courseId && data.studentId) continue;

    const courseId = courseIds.find((candidate) => document.id.startsWith(`${candidate}_`));
    if (!courseId) {
      problems.push(`courseProgress/${document.id}: could not identify courseId from document ID`);
      continue;
    }

    const studentId = document.id.slice(courseId.length + 1);
    if (!studentId) {
      problems.push(`courseProgress/${document.id}: could not identify studentId from document ID`);
      continue;
    }

    updates.push({
      path: `courseProgress/${document.id}`,
      data: { courseId, studentId },
    });
  }

  console.log(`${applyChanges ? 'Applying' : 'Dry run'} ${updates.length + legacyCourseBackfills.length} migration action(s).`);
  for (const update of updates) {
    console.log(`  ${update.path}: ${JSON.stringify(update.data)}`);
  }
  for (const course of legacyCourseBackfills) {
    console.log(`  courses/<new-id>: ${JSON.stringify({ ...course, description: '' })}`);
  }

  if (problems.length) {
    console.error(`\n${problems.length} record(s) need manual review:`);
    for (const problem of problems) console.error(`  ${problem}`);
  }

  if (!applyChanges) {
    console.log('\nNo data was changed. Re-run with --apply to write these updates.');
    return;
  }

  for (let index = 0; index < updates.length; index += 450) {
    const batch = db.batch();
    for (const update of updates.slice(index, index + 450)) {
      batch.set(db.doc(update.path), {
        ...update.data,
        migratedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
  }

  for (const course of legacyCourseBackfills) {
    const ref = db.collection('courses').doc();
    await ref.set({
      lecturerId: course.lecturerId,
      lecturerName: course.lecturerName,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      description: '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`  created ${ref.path}`);
  }

  console.log('Migration complete. Records needing manual review were not changed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
