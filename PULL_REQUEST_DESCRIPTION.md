Title: feat: add Firestore-backed Lecturer Dashboard, course manager, and enrollment flows

Summary:
Adds Firestore-backed features for lecturers and students: a realtime `LecturerDashboard`,
`LecturerCourseManager` for creating/publishing lessons and uploading materials, student
enrollment persistence (`enrollments/`), canonical `courses/` documents, and course progress
tracking (`courseProgress`). No authentication or Firebase auth flows were modified.

Files changed:
- client/src/pages/LecturerDashboard.tsx
- client/src/pages/LecturerCourseManager.tsx
- client/src/pages/CourseDetails.tsx
- client/src/pages/StudentDashboard.tsx
- client/src/pages/LecturerProfile.tsx
- client/src/lib/courses.ts
- client/src/lib/courseEnrollment.ts (+tests)
- client/src/firebase/config.ts

Setup / Environment:
- Ensure VITE_FIREBASE_* env vars are set (API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID).
- Review Firestore and Storage security rules for the expected dev flows or use emulator.

How to verify (smoke test):
1. Sign in as a lecturer account.
2. Create/save an offered course from Lecturer Profile or create a course in Lecturer Course Manager.
3. Add and publish lessons, and upload a material file.
4. Sign in as a student and enroll in that course via Student Dashboard.
5. Open the course as student, mark lessons complete; verify `courseProgress` document updates and Lecturer Dashboard reflects progress.

Migration note:
- Existing `users.offeredCourses` entries are not automatically converted to canonical `courses/` documents. Consider a one-time backfill script or admin UI.

Risks:
- New writes to Firestore and Storage; review security rules and quotas.
- UI polish and accessibility improvements remain pending.

Next steps (optional):
- Add CI tests for `client/src/lib/courses.ts` and `client/src/lib/courseEnrollment.ts`.
- Add a small backfill script to migrate existing offered courses into `courses/`.
