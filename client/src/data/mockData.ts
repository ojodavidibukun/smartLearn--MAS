// SmartLearn MAS - Mock Data
// Backend developers: Replace with actual API calls

import type {
  Student,
  Course,
  Lesson,
  Quiz,
  QuizResult,
  Assignment,
  StudentAssignment,
  Notification,
  Recommendation,
  StudentPerformance,
  AgentInfo,
} from '@/types';

export const mockStudent: Student = {
  id: 'STU001',
  name: 'David Ayomide',
  email: 'david.ayomide@university.edu',
  enrollmentDate: '2026-01-15',
  profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  totalCourses: 4,
  averageScore: 78.5,
};

export const mockCourses: Course[] = [
  {
    id: 'COURSE001',
    title: 'Digital Logic',
    code: 'CS201',
    description: 'Fundamentals of digital logic and circuit design',
    instructor: 'Dr. Daniel Okoye',
    enrollmentCount: 45,
    progress: 65,
  },
  {
    id: 'COURSE002',
    title: 'Data Structures',
    code: 'CS202',
    description: 'Advanced data structures and algorithms',
    instructor: 'Prof. Michael Eze',
    enrollmentCount: 52,
    progress: 42,
  },
  {
    id: 'COURSE003',
    title: 'Web Development',
    code: 'CS203',
    description: 'Modern web development with React and Node.js',
    instructor: 'Dr. Joy Adebayo',
    enrollmentCount: 38,
    progress: 78,
  },
  {
    id: 'COURSE004',
    title: 'Database Systems',
    code: 'CS204',
    description: 'Relational databases and SQL',
    instructor: 'Prof. James Musa',
    enrollmentCount: 41,
    progress: 55,
  },
];

export const mockLessons: Lesson[] = [
  {
    id: 'LESSON001',
    courseId: 'COURSE001',
    title: 'Introduction to Logic Gates',
    content: 'Learn about basic logic gates: AND, OR, NOT, NAND, NOR, XOR',
    duration: 45,
    completed: true,
    order: 1,
  },
  {
    id: 'LESSON002',
    courseId: 'COURSE001',
    title: 'Boolean Algebra',
    content: 'Master Boolean algebra principles and simplification techniques',
    duration: 50,
    completed: true,
    order: 2,
  },
  {
    id: 'LESSON003',
    courseId: 'COURSE001',
    title: 'Combinational Circuits',
    content: 'Design and analyze combinational logic circuits',
    duration: 60,
    completed: false,
    order: 3,
  },
  {
    id: 'LESSON004',
    courseId: 'COURSE001',
    title: 'Sequential Circuits',
    content: 'Explore flip-flops, counters, and state machines',
    duration: 55,
    completed: false,
    order: 4,
  },
];

export const mockQuiz: Quiz = {
  id: 'QUIZ001',
  lessonId: 'LESSON001',
  title: 'Logic Gates Assessment',
  timeLimit: 30,
  passingScore: 70,
  questions: [
    {
      id: 'Q1',
      question: 'What is the output of an AND gate with inputs 1 and 0?',
      options: ['0', '1', 'Undefined', 'Both 0 and 1'],
      correctAnswer: 0,
    },
    {
      id: 'Q2',
      question: 'Which gate produces output 1 only when all inputs are 1?',
      options: ['OR gate', 'AND gate', 'XOR gate', 'NOT gate'],
      correctAnswer: 1,
    },
    {
      id: 'Q3',
      question: 'What does a NOT gate do?',
      options: ['Inverts the input', 'Combines two inputs', 'Stores a value', 'Amplifies the signal'],
      correctAnswer: 0,
    },
  ],
};

export const mockQuizResults: QuizResult[] = [
  {
    id: 'RESULT001',
    studentId: 'STU001',
    quizId: 'QUIZ001',
    score: 45,
    maxScore: 100,
    completedAt: '2026-02-10',
    answers: [0, 1, 0],
  },
  {
    id: 'RESULT002',
    studentId: 'STU001',
    quizId: 'QUIZ002',
    score: 82,
    maxScore: 100,
    completedAt: '2026-02-15',
    answers: [1, 0, 1, 0],
  },
  {
    id: 'RESULT003',
    studentId: 'STU001',
    quizId: 'QUIZ003',
    score: 65,
    maxScore: 100,
    completedAt: '2026-02-20',
    answers: [0, 1, 0, 1],
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'ASSIGN001',
    courseId: 'COURSE001',
    title: 'Design a 4-bit Adder',
    description: 'Create a digital circuit that adds two 4-bit binary numbers',
    dueDate: '2026-03-01',
    submissionCount: 38,
  },
  {
    id: 'ASSIGN002',
    courseId: 'COURSE001',
    title: 'Logic Simplification Project',
    description: 'Simplify complex Boolean expressions using Karnaugh maps',
    dueDate: '2026-03-15',
    submissionCount: 35,
  },
];

export const mockStudentAssignments: StudentAssignment[] = [
  {
    id: 'STASSIGN001',
    studentId: 'STU001',
    assignmentId: 'ASSIGN001',
    submittedAt: '2026-02-28',
    status: 'graded',
    grade: 88,
    feedback: 'Excellent circuit design. Well-documented and efficient.',
  },
  {
    id: 'STASSIGN002',
    studentId: 'STU001',
    assignmentId: 'ASSIGN002',
    status: 'pending',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'NOTIF001',
    studentId: 'STU001',
    title: 'Quiz Score Below Target',
    message: 'Your recent quiz score (45%) is below the course average. Review Lesson 1 materials.',
    type: 'warning',
    read: false,
    createdAt: '2026-02-25T10:30:00Z',
    actionUrl: '/learning/COURSE001/LESSON001',
  },
  {
    id: 'NOTIF002',
    studentId: 'STU001',
    title: 'Assignment Graded',
    message: 'Your assignment "Design a 4-bit Adder" has been graded: 88/100',
    type: 'success',
    read: true,
    createdAt: '2026-02-28T14:15:00Z',
  },
  {
    id: 'NOTIF003',
    studentId: 'STU001',
    title: 'Upcoming Assignment Due',
    message: 'Assignment "Logic Simplification Project" is due in 2 days.',
    type: 'info',
    read: true,
    createdAt: '2026-03-13T09:00:00Z',
  },
];

export const mockRecommendations: Recommendation[] = [
  {
    id: 'REC001',
    studentId: 'STU001',
    title: 'Review Digital Logic Fundamentals',
    reason: 'Quiz score is below 50%. Mastering basics is essential for advanced topics.',
    priority: 'high',
    suggestedAction: 'Study Lesson 3 (Combinational Circuits) before attempting another quiz.',
    createdAt: '2026-02-25T10:30:00Z',
  },
  {
    id: 'REC002',
    studentId: 'STU001',
    title: 'Increase Assignment Submission Rate',
    reason: 'You have completed 50% of assignments. Consistent practice improves learning outcomes.',
    priority: 'medium',
    suggestedAction: 'Complete the pending "Logic Simplification Project" assignment by March 15.',
    createdAt: '2026-02-26T08:00:00Z',
  },
  {
    id: 'REC003',
    studentId: 'STU001',
    title: 'Explore Advanced Topics',
    reason: 'Your Web Development course progress (78%) shows strong engagement. Consider advanced modules.',
    priority: 'low',
    suggestedAction: 'Check out the optional "Advanced React Patterns" module in CS203.',
    createdAt: '2026-02-27T11:20:00Z',
  },
];

export const mockStudentPerformance: StudentPerformance = {
  studentId: 'STU001',
  averageQuizScore: 64,
  assignmentCompletion: 85,
  attendanceRate: 92,
  riskLevel: 'medium',
  lastUpdated: '2026-02-25T15:30:00Z',
};

export const mockAgents: AgentInfo[] = [
  {
    id: 'AGENT001',
    name: 'Student Agent',
    purpose: 'Manages student profile, enrollment, and personal learning preferences',
    inputs: ['Student ID', 'Enrollment Data', 'Learning Preferences'],
    processing: 'Aggregates student information and maintains learning profile state',
    outputs: ['Student Profile', 'Enrollment Status', 'Preference Settings'],
    relatedAgents: ['AGENT002', 'AGENT003', 'AGENT006'],
  },
  {
    id: 'AGENT002',
    name: 'Learning Agent',
    purpose: 'Delivers personalized learning content and adapts difficulty based on performance',
    inputs: ['Student Profile', 'Learning History', 'Performance Data'],
    processing: 'Selects appropriate lessons and adjusts content complexity dynamically',
    outputs: ['Personalized Lesson Plan', 'Adapted Content', 'Learning Path'],
    relatedAgents: ['AGENT001', 'AGENT003', 'AGENT005'],
  },
  {
    id: 'AGENT003',
    name: 'Performance Monitoring Agent',
    purpose: 'Tracks student performance metrics and identifies at-risk students',
    inputs: ['Quiz Scores', 'Attendance Records', 'Assignment Submissions'],
    processing: 'Calculates performance indicators and risk levels using rule-based logic',
    outputs: ['Performance Report', 'Risk Assessment', 'Performance Trends'],
    relatedAgents: ['AGENT001', 'AGENT004', 'AGENT005'],
  },
  {
    id: 'AGENT004',
    name: 'Recommendation Agent',
    purpose: 'Generates personalized learning recommendations based on performance gaps',
    inputs: ['Performance Data', 'Learning History', 'Course Requirements'],
    processing: 'Applies rule-based logic to identify improvement areas and suggest resources',
    outputs: ['Personalized Recommendations', 'Learning Resources', 'Action Plans'],
    relatedAgents: ['AGENT003', 'AGENT005', 'AGENT006'],
  },
  {
    id: 'AGENT005',
    name: 'Notification Agent',
    purpose: 'Sends timely notifications about assignments, grades, and recommendations',
    inputs: ['Performance Updates', 'Assignment Deadlines', 'Recommendation Triggers'],
    processing: 'Determines notification priority and delivery timing',
    outputs: ['Notifications', 'Alerts', 'Reminders'],
    relatedAgents: ['AGENT002', 'AGENT003', 'AGENT004', 'AGENT006'],
  },
  {
    id: 'AGENT006',
    name: 'Lecturer Agent',
    purpose: 'Provides instructors with class analytics and student performance insights',
    inputs: ['Class Performance Data', 'Student Analytics', 'Engagement Metrics'],
    processing: 'Aggregates and analyzes class-level data for instructor dashboard',
    outputs: ['Class Analytics', 'Student Insights', 'Engagement Reports'],
    relatedAgents: ['AGENT001', 'AGENT003', 'AGENT004', 'AGENT005'],
  },
];

// Helper function to get current user (demo purposes)
export function getCurrentUser() {
  const role = localStorage.getItem('userRole') || 'student';
  if (role === 'student') {
    return { ...mockStudent, role: 'student' as const };
  }
  return {
    id: 'LECTURER001',
    name: 'Dr. Daniel Okoye',
    email: 'daniel.okoye@university.edu',
    role: 'lecturer' as const,
  };
}

// Helper function to get unread notifications count
export function getUnreadNotificationsCount(): number {
  return mockNotifications.filter((n) => !n.read).length;
}

// Helper function to get high-priority recommendations
export function getHighPriorityRecommendations(): Recommendation[] {
  return mockRecommendations.filter((r) => r.priority === 'high');
}
